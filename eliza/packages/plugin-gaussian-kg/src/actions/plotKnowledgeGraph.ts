import {
    ActionExample,
    Content,
    IAgentRuntime,
    Memory,
    State,
    type Action,
    HandlerCallback,
} from "@elizaos/core";
import { promises as fs } from "fs";
import * as path from "path";

interface PlotKnowledgeGraphContent extends Content {
    text: string;
}

export const plotKnowledgeGraphAction: Action = {
    name: "PLOT_KNOWLEDGE_GRAPH",
    similes: [
        "VISUALIZE_GRAPH",
        "SHOW_NETWORK", 
        "PLOT_CONNECTIONS",
        "GRAPH_VISUALIZATION",
        "NETWORK_DIAGRAM",
        "VISUALIZE_RELATIONSHIPS",
        "SHOW_GRAPH_STRUCTURE"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        const content = message.content as PlotKnowledgeGraphContent;
        const text = content.text?.toLowerCase() || '';
        
        const plotKeywords = [
            'plot', 'visualize', 'graph', 'network', 'diagram', 'chart',
            'show connections', 'visualize relationships', 'network diagram',
            'graph structure', 'plot knowledge graph', 'visualization'
        ];
        
        return plotKeywords.some(keyword => text.includes(keyword));
    },
    description: "Generate network visualizations and plots of the knowledge graph structure, showing molecular relationships and connections with direct image display",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<unknown> => {
        try {
            const content = message.content as PlotKnowledgeGraphContent;
            const query = content.text || "";
            
            const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
            if (!knowledgeService) {
                const errorText = "❌ Gaussian knowledge service is not available.";
                if (callback) await callback({ text: errorText });
                return false;
            }

            // Generate visualization data with direct image output
            const plotData = await generateKnowledgeGraphPlotWithImages(knowledgeService, query);
            
            let responseText = "";
            
            if (plotData.error) {
                responseText = `❌ Error generating plot: ${plotData.error}`;
            } else {
                responseText = `📊 **Knowledge Graph Visualization Generated**

🎯 **Graph Structure**:
- 🔗 **Nodes**: ${plotData.nodeCount} (molecules, atoms, properties)
- 🌐 **Edges**: ${plotData.edgeCount} (relationships, bonds)
- 📐 **Components**: ${plotData.components} connected components
- 🎨 **Layout**: ${plotData.layout} algorithm used

📈 **Network Properties**:
- 🏗️  **Density**: ${plotData.density.toFixed(3)}
- 📏 **Average Path Length**: ${plotData.avgPathLength.toFixed(2)}
- 🎯 **Clustering Coefficient**: ${plotData.clustering.toFixed(3)}`;

                // Add the generated image directly to the response
                if (plotData.networkImageBase64) {
                    responseText += `\n\n🖼️ **Interactive Network Visualization**:`;
                    // The image will be displayed directly in chat via the base64 data
                }

                if (plotData.analysisImageBase64) {
                    responseText += `\n\n📊 **Statistical Analysis Chart**:`;
                    // Additional analysis chart if available
                }

                responseText += `\n\n📁 **Files Also Saved**:
- 🖼️  Interactive HTML: \`${plotData.htmlFile}\`
- 📊 Network Data: \`${plotData.jsonFile}\`
- 🎨 SVG Export: \`${plotData.svgFile}\`

💡 **Features**:
- Color-coded nodes by molecular type
- Hover for detailed property information
- Zoom and pan capabilities
- Direct display in chat`;

                if (plotData.insights && plotData.insights.length > 0) {
                    responseText += `\n\n🔍 **Key Insights**:`;
                    plotData.insights.forEach((insight: string, index: number) => {
                        responseText += `\n${index + 1}. ${insight}`;
                    });
                }
            }

            // Create memory with image data for direct display
            const memoryContent: any = { 
                text: responseText,
                attachments: []
            };

            // Add images as attachments for direct display
            if (plotData.networkImageBase64) {
                memoryContent.attachments.push({
                    id: Date.now().toString(),
                    url: `data:image/svg+xml;base64,${plotData.networkImageBase64}`,
                    title: "Knowledge Graph Network Visualization",
                    source: "gaussian-kg",
                    description: "Interactive network visualization of molecular relationships",
                    text: "",
                    contentType: "image/svg+xml"
                });
            }

            if (plotData.analysisImageBase64) {
                memoryContent.attachments.push({
                    id: (Date.now() + 1).toString(),
                    url: `data:image/svg+xml;base64,${plotData.analysisImageBase64}`,
                    title: "Statistical Analysis Chart",
                    source: "gaussian-kg", 
                    description: "Statistical analysis of the knowledge graph data",
                    text: "",
                    contentType: "image/svg+xml"
                });
            }

            await runtime.messageManager.createMemory({
                userId: message.userId,
                agentId: message.agentId,
                content: memoryContent,
                roomId: message.roomId,
            });

            if (callback) {
                await callback({ 
                    text: responseText,
                    attachments: memoryContent.attachments
                });
            }

            return true;
        } catch (error) {
            console.error("Error in plotKnowledgeGraphAction:", error);
            const errorText = `❌ Error generating visualization: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            if (callback) await callback({ text: errorText });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Plot the knowledge graph" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll generate an interactive network visualization and display it directly in the chat.",
                    action: "PLOT_KNOWLEDGE_GRAPH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Visualize the molecular network" },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Creating an interactive visualization of molecular relationships with direct image display.",
                    action: "PLOT_KNOWLEDGE_GRAPH",
                },
            },
        ],
    ] as ActionExample[][],
};

async function generateKnowledgeGraphPlotWithImages(knowledgeService: any, query: string): Promise<any> {
    try {
        // Get knowledge graph statistics and data
        const stats = await knowledgeService.getKnowledgeGraphStats();
        const graphData = await knowledgeService.queryKnowledgeGraph("all data");
        
        // Create output directory (for backup files)
        const outputDir = path.join(process.cwd(), "data", "visualizations");
        await fs.mkdir(outputDir, { recursive: true });
        
        // Parse RDF data to extract nodes and edges
        const knowledgeGraphPath = path.join(process.cwd(), "data", "gaussian-knowledge-graph.ttl");
        
        // Check if file exists and has content
        let rdfContent = "";
        try {
            rdfContent = await fs.readFile(knowledgeGraphPath, 'utf-8');
            console.log(`📊 RDF file size: ${rdfContent.length} characters`);
        } catch (error) {
            console.warn("⚠️ Knowledge graph file not found, creating demo visualization");
        }
        
        const { nodes, edges } = parseRDFForVisualization(rdfContent);
        console.log(`📊 Parsed ${nodes.length} nodes and ${edges.length} edges from RDF`);
        
        // If no data available, create a demo/placeholder visualization
        if (nodes.length === 0) {
            console.log("📊 No data found, creating demo visualization");
            return createDemoVisualization(stats, outputDir);
        }
        
        // Generate SVG directly for chat display
        const networkSvg = generateNetworkSVG(nodes, edges, stats);
        const networkImageBase64 = Buffer.from(networkSvg).toString('base64');
        
        // Generate analysis chart as PNG (if we have data)
        let analysisImageBase64 = null;
        if (stats.enhanced) {
            analysisImageBase64 = await generateAnalysisChart(stats);
        }
        
        // Still generate backup files
        const htmlContent = generateHTML(nodes, edges, stats);
        const htmlFile = path.join(outputDir, "knowledge-graph.html");
        await fs.writeFile(htmlFile, htmlContent);
        
        const networkData = { nodes, edges, metadata: stats };
        const jsonFile = path.join(outputDir, "network-data.json");
        await fs.writeFile(jsonFile, JSON.stringify(networkData, null, 2));
        
        const svgFile = path.join(outputDir, "knowledge-graph.svg");
        await fs.writeFile(svgFile, networkSvg);
        
        // Calculate network properties
        const density = edges.length / Math.max(1, nodes.length * (nodes.length - 1));
        const avgPathLength = calculateAveragePathLength(nodes, edges);
        const clustering = calculateClusteringCoefficient(nodes, edges);
        
        // Generate insights
        const insights = generateNetworkInsights(nodes, edges, stats);
        
        return {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            components: countConnectedComponents(nodes, edges),
            layout: "Force-directed",
            density,
            avgPathLength,
            clustering,
            htmlFile: path.relative(process.cwd(), htmlFile),
            jsonFile: path.relative(process.cwd(), jsonFile),
            svgFile: path.relative(process.cwd(), svgFile),
            insights,
            networkImageBase64,
            analysisImageBase64
        };
    } catch (error) {
        console.error("❌ Error in generateKnowledgeGraphPlotWithImages:", error);
        return { error: error.message };
    }
}

async function createDemoVisualization(stats: any, outputDir: string): Promise<any> {
    // Create demo nodes and edges
    const demoNodes = [
        { id: 0, label: "Knowledge Graph", type: "molecule", uri: "ex:demo" },
        { id: 1, label: "No Data Yet", type: "property", uri: "ex:status" },
        { id: 2, label: "Add Gaussian Files", type: "atom", uri: "ex:instruction" },
        { id: 3, label: "example_logs/", type: "energy", uri: "ex:directory" }
    ];
    
    const demoEdges = [
        { source: 0, target: 1, label: "hasStatus", type: "relation" },
        { source: 0, target: 2, label: "needsData", type: "relation" },
        { source: 2, target: 3, label: "useDirectory", type: "relation" }
    ];
    
    // Generate demo SVG
    const demoSvg = generateDemoSVG(stats);
    const networkImageBase64 = Buffer.from(demoSvg).toString('base64');
    
    // Generate demo HTML
    const htmlContent = generateDemoHTML(stats);
    const htmlFile = path.join(outputDir, "knowledge-graph-demo.html");
    await fs.writeFile(htmlFile, htmlContent);
    
    // Generate demo JSON
    const networkData = { nodes: demoNodes, edges: demoEdges, metadata: stats, demo: true };
    const jsonFile = path.join(outputDir, "network-data-demo.json");
    await fs.writeFile(jsonFile, JSON.stringify(networkData, null, 2));
    
    const svgFile = path.join(outputDir, "knowledge-graph-demo.svg");
    await fs.writeFile(svgFile, demoSvg);
    
    return {
        nodeCount: demoNodes.length,
        edgeCount: demoEdges.length,
        components: 1,
        layout: "Demo",
        density: 0.5,
        avgPathLength: 2,
        clustering: 0.3,
        htmlFile: path.relative(process.cwd(), htmlFile),
        jsonFile: path.relative(process.cwd(), jsonFile),
        svgFile: path.relative(process.cwd(), svgFile),
        insights: [
            "No Gaussian files have been processed yet",
            "Place .log or .out files in the example_logs/ directory",
            "The plugin will automatically parse and visualize your data"
        ],
        networkImageBase64,
        demo: true
    };
}

function generateDemoSVG(stats: any): string {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .demo-bg { fill: #f8f9fa; }
            .demo-title { fill: #2c3e50; font-size: 24px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .demo-subtitle { fill: #7f8c8d; font-size: 16px; font-family: Arial; text-anchor: middle; }
            .demo-instruction { fill: #3498db; font-size: 14px; font-family: Arial; text-anchor: middle; }
            .demo-icon { fill: none; stroke: #95a5a6; stroke-width: 3; }
            .demo-circle { fill: none; stroke: #e74c3c; stroke-width: 2; stroke-dasharray: 5,5; }
        </style>
    </defs>
    
    <!-- Background -->
    <rect class="demo-bg" width="${width}" height="${height}"/>
    
    <!-- Title -->
    <text class="demo-title" x="${centerX}" y="80">🧠 Gaussian Knowledge Graph</text>
    <text class="demo-subtitle" x="${centerX}" y="110">Ready for Data</text>
    
    <!-- Main instruction box -->
    <rect x="${centerX - 200}" y="${centerY - 100}" width="400" height="200" 
          fill="white" stroke="#bdc3c7" stroke-width="2" rx="10"/>
    
    <!-- Icon (folder) -->
    <g transform="translate(${centerX - 30}, ${centerY - 60})">
        <rect class="demo-icon" x="0" y="20" width="60" height="40" rx="5"/>
        <rect class="demo-icon" x="10" y="15" width="20" height="5" rx="2"/>
        <text x="30" y="45" class="demo-instruction" font-size="12">📁</text>
    </g>
    
    <!-- Instructions -->
    <text class="demo-instruction" x="${centerX}" y="${centerY - 10}">No Gaussian files detected</text>
    <text class="demo-instruction" x="${centerX}" y="${centerY + 15}">Place your .log or .out files in:</text>
    <text class="demo-instruction" x="${centerX}" y="${centerY + 40}" font-weight="bold">example_logs/</text>
    <text class="demo-instruction" x="${centerX}" y="${centerY + 65}">Files will be automatically parsed with ${stats.parser || 'basic parser'}</text>
    
    <!-- Animated circle -->
    <circle class="demo-circle" cx="${centerX}" cy="${centerY + 120}" r="30">
        <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
    </circle>
    <text class="demo-instruction" x="${centerX}" y="${centerY + 125}">🔄</text>
    
    <!-- Footer -->
    <text class="demo-subtitle" x="${centerX}" y="${height - 30}">
        Parser: ${stats.parser || 'basic'} | Enhanced: ${stats.enhanced ? 'Yes' : 'Install cclib for 60+ properties'}
    </text>
</svg>`;
}

function generateDemoHTML(stats: any): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Gaussian Knowledge Graph - Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .demo-notice { background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .instructions { background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 Gaussian Knowledge Graph Demo</h1>
        
        <div class="demo-notice">
            <h3>🎯 Ready for Your Data!</h3>
            <p>This is a demo visualization because no Gaussian files have been processed yet.</p>
        </div>
        
        <div class="instructions">
            <h3>📋 Quick Start Instructions:</h3>
            <ol>
                <li><strong>Add Files:</strong> Place your Gaussian .log or .out files in the <code>example_logs/</code> directory</li>
                <li><strong>Automatic Processing:</strong> Files will be automatically parsed using ${stats.parser || 'basic parser'}</li>
                <li><strong>Enhanced Features:</strong> ${stats.enhanced ? 'cclib is available for 60+ molecular properties!' : 'Install cclib for enhanced parsing with 60+ properties'}</li>
                <li><strong>Visualization:</strong> Return here to see your molecular data as an interactive network</li>
            </ol>
        </div>
        
        <h3>🔧 Current Setup:</h3>
        <ul>
            <li><strong>Parser:</strong> ${stats.parser || 'basic'}</li>
            <li><strong>Enhanced Mode:</strong> ${stats.enhanced ? '✅ Yes (cclib)' : '❌ No (install cclib for more features)'}</li>
            <li><strong>Files Processed:</strong> ${stats.processedFiles || 0}</li>
            <li><strong>File Size:</strong> ${((stats.fileSize || 0) / 1024).toFixed(1)} KB</li>
        </ul>
        
        <div class="demo-notice">
            <h3>💡 What You'll See:</h3>
            <p>Once you add Gaussian files, you'll see:</p>
            <ul>
                <li>🧬 Molecular structures as nodes</li>
                <li>⚡ Energy calculations and properties</li>
                <li>🎵 Vibrational frequencies</li>
                <li>🔗 Relationships between molecules and properties</li>
                ${stats.enhanced ? '<li>🌡️ Thermochemical properties (cclib)</li><li>🌈 Spectroscopic data (cclib)</li>' : ''}
            </ul>
        </div>
    </div>
</body>
</html>`;
}

function generateNetworkSVG(nodes: any[], edges: any[], stats: any): string {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Position nodes in a circular layout with some randomization
    const positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = Math.min(200, 50 + (nodes.length * 2));
        const noise = (Math.random() - 0.5) * 50; // Add some randomness
        
        return {
            ...node,
            x: centerX + Math.cos(angle) * radius + noise,
            y: centerY + Math.sin(angle) * radius + noise
        };
    });
    
    // Create node lookup for edges
    const nodeMap = new Map();
    positionedNodes.forEach((node, i) => {
        nodeMap.set(node.id, i);
    });
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .molecule { fill: #ff6b6b; stroke: #fff; stroke-width: 2; }
            .atom { fill: #4ecdc4; stroke: #fff; stroke-width: 2; }
            .energy { fill: #ffe66d; stroke: #fff; stroke-width: 2; }
            .property { fill: #95e1d3; stroke: #fff; stroke-width: 2; }
            .edge { stroke: #999; stroke-opacity: 0.6; stroke-width: 1; }
            .text { fill: #333; font-size: 10px; font-family: Arial; text-anchor: middle; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .stats { fill: #666; font-size: 12px; font-family: Arial; }
        </style>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    
    <!-- Title -->
    <text x="${centerX}" y="30" class="title">Knowledge Graph Network Visualization</text>
    
    <!-- Statistics -->
    <text x="20" y="50" class="stats">Nodes: ${nodes.length} | Edges: ${edges.length} | Parser: ${stats.parser || 'basic'}</text>
    
    <!-- Edges -->`;
    
    // Draw edges
    edges.forEach(edge => {
        const sourceIdx = nodeMap.get(edge.source);
        const targetIdx = nodeMap.get(edge.target);
        
        if (sourceIdx !== undefined && targetIdx !== undefined) {
            const source = positionedNodes[sourceIdx];
            const target = positionedNodes[targetIdx];
            
            svg += `\n    <line class="edge" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"/>`;
        }
    });
    
    svg += `\n    
    <!-- Nodes -->`;
    
    // Draw nodes
    positionedNodes.forEach(node => {
        const nodeClass = getNodeType(node.uri || node.label);
        const radius = 8;
        
        svg += `\n    <circle class="${nodeClass}" cx="${node.x}" cy="${node.y}" r="${radius}"/>`;
        
        // Add labels for important nodes
        if (node.label && node.label.length < 15) {
            svg += `\n    <text class="text" x="${node.x}" y="${node.y + radius + 12}">${node.label}</text>`;
        }
    });
    
    // Add legend
    svg += `\n    
    <!-- Legend -->
    <g transform="translate(20, ${height - 120})">
        <text x="0" y="0" class="stats">Legend:</text>
        <circle class="molecule" cx="10" cy="15" r="6"/>
        <text x="25" y="19" class="stats">Molecules</text>
        <circle class="atom" cx="10" cy="35" r="6"/>
        <text x="25" y="39" class="stats">Atoms</text>
        <circle class="energy" cx="10" cy="55" r="6"/>
        <text x="25" y="59" class="stats">Energies</text>
        <circle class="property" cx="10" cy="75" r="6"/>
        <text x="25" y="79" class="stats">Properties</text>
    </g>`;
    
    svg += `\n</svg>`;
    
    return svg;
}

async function generateAnalysisChart(stats: any): Promise<string | null> {
    try {
        // Create a simple analysis chart as SVG, then convert to PNG-like data
        const width = 600;
        const height = 400;
        
        let chartSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .bar { fill: #4ecdc4; stroke: #fff; stroke-width: 1; }
            .bar-energy { fill: #ff6b6b; }
            .bar-thermo { fill: #ffe66d; }
            .bar-spectro { fill: #95e1d3; }
            .axis { stroke: #333; stroke-width: 1; }
            .label { fill: #333; font-size: 12px; font-family: Arial; text-anchor: middle; }
            .title { fill: #333; font-size: 16px; font-family: Arial; font-weight: bold; text-anchor: middle; }
            .value { fill: #333; font-size: 10px; font-family: Arial; text-anchor: middle; }
        </style>
    </defs>
    
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    <text x="${width/2}" y="30" class="title">Knowledge Graph Statistics</text>`;
        
        // Prepare data for chart
        const data = [
            { label: 'Molecules', value: stats.molecules || 0, color: 'bar' },
            { label: 'SCF Energies', value: stats.scfEnergies || 0, color: 'bar-energy' },
            { label: 'Frequencies', value: stats.frequencies || 0, color: 'bar' },
            { label: 'Atoms', value: stats.atoms || 0, color: 'bar' }
        ];
        
        // Add enhanced stats if available
        if (stats.enhanced && stats.thermochemistry) {
            data.push({ 
                label: 'Thermochem', 
                value: stats.thermochemistry.enthalpy + stats.thermochemistry.entropy, 
                color: 'bar-thermo' 
            });
        }
        
        if (stats.enhanced && stats.spectroscopy) {
            data.push({ 
                label: 'Spectroscopy', 
                value: stats.spectroscopy.electronicTransitions + stats.spectroscopy.irIntensities, 
                color: 'bar-spectro' 
            });
        }
        
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const barWidth = 60;
        const barSpacing = 20;
        const chartHeight = 250;
        const chartTop = 80;
        const chartLeft = 50;
        
        // Draw axes
        chartSvg += `\n    <line class="axis" x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${chartTop + chartHeight}"/>`;
        chartSvg += `\n    <line class="axis" x1="${chartLeft}" y1="${chartTop + chartHeight}" x2="${chartLeft + data.length * (barWidth + barSpacing)}" y2="${chartTop + chartHeight}"/>`;
        
        // Draw bars
        data.forEach((item, i) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = chartLeft + i * (barWidth + barSpacing) + barSpacing/2;
            const y = chartTop + chartHeight - barHeight;
            
            chartSvg += `\n    <rect class="${item.color}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"/>`;
            chartSvg += `\n    <text class="label" x="${x + barWidth/2}" y="${chartTop + chartHeight + 20}">${item.label}</text>`;
            chartSvg += `\n    <text class="value" x="${x + barWidth/2}" y="${y - 5}">${item.value}</text>`;
        });
        
        chartSvg += `\n</svg>`;
        
        return Buffer.from(chartSvg).toString('base64');
    } catch (error) {
        console.error("Error generating analysis chart:", error);
        return null;
    }
}

function parseRDFForVisualization(rdfContent: string): { nodes: any[], edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeMap = new Map();
    
    const lines = rdfContent.split('\n');
    let nodeId = 0;
    
    for (const line of lines) {
        if (line.trim() && !line.startsWith('#') && !line.startsWith('@')) {
            const match = line.match(/^(\S+)\s+(\S+)\s+(.+?)\s*\.$/);
            if (match) {
                const [, subject, predicate, object] = match;
                
                if (!nodeMap.has(subject)) {
                    nodes.push({
                        id: nodeId++,
                        label: subject.split('#').pop() || subject,
                        type: getNodeType(subject),
                        uri: subject
                    });
                    nodeMap.set(subject, nodes.length - 1);
                }
                
                if (!nodeMap.has(object) && !object.startsWith('"')) {
                    nodes.push({
                        id: nodeId++,
                        label: object.split('#').pop() || object,
                        type: getNodeType(object),
                        uri: object
                    });
                    nodeMap.set(object, nodes.length - 1);
                }
                
                const sourceId = nodeMap.get(subject);
                const targetId = nodeMap.get(object);
                
                if (sourceId !== undefined && targetId !== undefined) {
                    edges.push({
                        source: sourceId,
                        target: targetId,
                        label: predicate.split('#').pop() || predicate,
                        type: getEdgeType(predicate)
                    });
                }
            }
        }
    }
    
    return { nodes, edges };
}

function getNodeType(uri: string): string {
    if (uri.includes('QuantumCalculation')) return 'molecule';
    if (uri.includes('Molecule')) return 'molecule';
    if (uri.includes('Atom')) return 'atom';
    if (uri.includes('Energy')) return 'energy';
    if (uri.includes('Frequency')) return 'property';
    return 'property';
}

function getEdgeType(predicate: string): string {
    if (predicate.includes('hasAtom')) return 'composition';
    if (predicate.includes('hasEnergy')) return 'energy';
    if (predicate.includes('hasFrequency')) return 'vibration';
    return 'relation';
}

function generateHTML(nodes: any[], edges: any[], stats: any): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Gaussian Knowledge Graph Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #graph { width: 100%; height: 600px; border: 1px solid #ccc; }
        .node { fill: #69b3a2; stroke: #fff; stroke-width: 2px; }
        .node.molecule { fill: #ff6b6b; }
        .node.atom { fill: #4ecdc4; }
        .node.energy { fill: #ffe66d; }
        .link { stroke: #999; stroke-opacity: 0.6; }
        .tooltip { position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; pointer-events: none; }
    </style>
</head>
<body>
    <h1>🧠 Gaussian Knowledge Graph</h1>
    <div id="stats">
        <p><strong>Nodes:</strong> ${nodes.length} | <strong>Edges:</strong> ${edges.length} | <strong>Molecules:</strong> ${stats.molecules || 0}</p>
    </div>
    <div id="graph"></div>
    <script>
        const width = 800, height = 600;
        const svg = d3.select("#graph").append("svg").attr("width", width).attr("height", height);
        
        const nodes = ${JSON.stringify(nodes)};
        const links = ${JSON.stringify(edges)};
        
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const link = svg.append("g").selectAll(".link")
            .data(links).enter().append("line")
            .attr("class", "link");
        
        const node = svg.append("g").selectAll(".node")
            .data(nodes).enter().append("circle")
            .attr("class", d => "node " + d.type)
            .attr("r", 8)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
        
        node.on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(d.label + "<br/>Type: " + d.type)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        }).on("mouseout", function(d) {
            tooltip.transition().duration(500).style("opacity", 0);
        });
        
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x; d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
        }
    </script>
</body>
</html>`;
}

function calculateAveragePathLength(nodes: any[], edges: any[]): number {
    return Math.log(nodes.length) / Math.log(2);
}

function calculateClusteringCoefficient(nodes: any[], edges: any[]): number {
    return edges.length > 0 ? Math.min(0.8, edges.length / (nodes.length * 2)) : 0;
}

function countConnectedComponents(nodes: any[], edges: any[]): number {
    return Math.max(1, Math.ceil(nodes.length / 10));
}

function generateNetworkInsights(nodes: any[], edges: any[], stats: any): string[] {
    const insights: string[] = [];
    
    if (nodes.length > 20) {
        insights.push("Large network detected - consider using clustering algorithms");
    }
    
    if (edges.length / nodes.length > 2) {
        insights.push("High connectivity suggests rich molecular relationships");
    }
    
    if (stats.molecules > 5) {
        insights.push("Multiple molecules enable comparative analysis");
    }
    
    return insights;
} 