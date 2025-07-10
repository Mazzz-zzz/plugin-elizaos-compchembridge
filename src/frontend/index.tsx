import { createRoot } from 'react-dom/client';
import './index.css';
import React from 'react';
import type { UUID } from '@elizaos/core';

// Define the interface for the ELIZA_CONFIG
interface ElizaConfig {
  agentId: string;
  apiBase: string;
}

// Define the interface for time response
interface TimeResponse {
  timestamp: string;
  unix: number;
  formatted: string;
  timezone: string;
}

// Define the interface for chart data
interface ChartData {
  folder: string;
  timestamp: number;
  files: string[];
}

/**
 * Time display component that fetches from backend
 */
function TimeDisplay({ apiBase }: { apiBase: string }) {
  const [data, setData] = React.useState<TimeResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchTime = React.useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${apiBase}/api/time`);
      if (!response.ok) {
        throw new Error('Failed to fetch time');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchTime();
    const interval = setInterval(fetchTime, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, [fetchTime]);

  if (isLoading) {
    return <div className="text-gray-600">Loading time...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error fetching time: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="time-display">
      <h2 className="text-lg font-semibold">Current Time</h2>
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Formatted:</span> {data?.formatted}
        </div>
        <div>
          <span className="font-medium">Timezone:</span> {data?.timezone}
        </div>
        <div>
          <span className="font-medium">Unix:</span> {data?.unix}
        </div>
      </div>
      <button
        onClick={() => fetchTime()}
        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
        data-testid="refresh-button"
      >
        Refresh
      </button>
    </div>
  );
}

/**
 * Charts display component that shows generated visualizations
 */
function ChartsDisplay({ apiBase }: { apiBase: string }) {
  const [charts, setCharts] = React.useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [selectedChart, setSelectedChart] = React.useState<string | null>(null);

  const fetchCharts = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Get list of chart directories
      const response = await fetch(`${apiBase}/api/charts`);
      if (!response.ok) {
        throw new Error('Failed to fetch charts list');
      }
      const chartDirectories = await response.json();
      
      // Parse chart data from directory names and detect files
      const parsedCharts = await Promise.all(
        (chartDirectories as string[])
          .filter((dir: string) => dir.startsWith('visualization-'))
          .map(async (dir: string) => {
            const timestamp = parseInt(dir.replace('visualization-', ''));
            
            // Common chart filenames to check for
            const possibleFiles = [
              'overview_chart.png',
              'overview.png', 
              'energy_chart.png',
              'energy.png',
              'molecular_chart.png',
              'molecular.png',
              'frequency_chart.png',
              'frequency.png'
            ];
            
            // Check which files actually exist by trying to fetch them
            const existingFiles: string[] = [];
            for (const filename of possibleFiles) {
              try {
                const fileResponse = await fetch(`${apiBase}/charts/${dir}/${filename}`, { method: 'HEAD' });
                if (fileResponse.ok) {
                  existingFiles.push(filename);
                }
              } catch {
                // File doesn't exist, skip
              }
            }
            
            return {
              folder: dir,
              timestamp,
              files: existingFiles.length > 0 ? existingFiles : ['overview_chart.png'] // Fallback
            };
          })
      );
      
      // Sort by timestamp (newest first)
      parsedCharts.sort((a: ChartData, b: ChartData) => b.timestamp - a.timestamp);
      setCharts(parsedCharts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  const getChartUrl = (folder: string, filename: string) => {
    // For now, we'll use a data URL approach since direct serving isn't working
    return `${apiBase}/charts/${folder}/${filename}`;
  };

  if (isLoading) {
    return <div className="text-gray-600">Loading charts...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error loading charts: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="charts-display">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Visualizations</h2>
        <button
          onClick={fetchCharts}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Refresh
        </button>
      </div>
      
      {charts.length === 0 ? (
        <div className="text-gray-600 text-center py-8">
          No visualizations found. Generate some charts first!
        </div>
      ) : (
        <div className="space-y-4">
          {charts.map((chart) => (
            <div key={chart.folder} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  Visualization {new Date(chart.timestamp).toLocaleString()}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {chart.folder}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chart.files.map((filename) => (
                  <div key={filename} className="space-y-2">
                    <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={getChartUrl(chart.folder, filename)}
                        alt={`Chart: ${filename}`}
                        className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedChart(getChartUrl(chart.folder, filename))}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden flex items-center justify-center h-full text-gray-500 text-sm">
                        Failed to load chart
                      </div>
                    </div>
                    <div className="text-sm text-center">
                      <a
                        href={getChartUrl(chart.folder, filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {filename}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal for full-size chart viewing */}
      {selectedChart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedChart(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedChart}
              alt="Full size chart"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedChart(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Example route component
 */
function ExampleRoute() {
  const config = (window as any).ELIZA_CONFIG as ElizaConfig | undefined;
  const agentId = config?.agentId;
  const apiBase = config?.apiBase || 'http://localhost:3000';

  // Apply dark mode to the root element
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (!agentId) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 font-medium">Error: Agent ID not found</div>
        <div className="text-sm text-gray-600 mt-2">
          The server should inject the agent ID configuration.
        </div>
      </div>
    );
  }

  return <ExampleProvider agentId={agentId as UUID} apiBase={apiBase} />;
}

/**
 * Example provider component
 */
function ExampleProvider({ agentId, apiBase }: { agentId: UUID; apiBase: string }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Computational Chemistry Plugin</h1>
        <div className="text-sm text-muted-foreground">Agent ID: {agentId}</div>
      </div>
      <TimeDisplay apiBase={apiBase} />
      <ChartsDisplay apiBase={apiBase} />
    </div>
  );
}

// Initialize the application - no router needed for iframe
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<ExampleRoute />);
}

// Define types for integration with agent UI system
export interface AgentPanel {
  name: string;
  path: string;
  component: React.ComponentType<any>;
  icon?: string;
  public?: boolean;
  shortLabel?: string; // Optional short label for mobile
}

interface PanelProps {
  agentId: string;
}

/**
 * Example panel component for the plugin system
 */
const PanelComponent: React.FC<PanelProps> = ({ agentId }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Example Panel</h2>
      <div>Hello {agentId}!</div>
    </div>
  );
};

// Export the panel configuration for integration with the agent UI
export const panels: AgentPanel[] = [
  {
    name: 'Example',
    path: 'example',
    component: PanelComponent,
    icon: 'Book',
    public: false,
    shortLabel: 'Example',
  },
];

export * from './utils';
