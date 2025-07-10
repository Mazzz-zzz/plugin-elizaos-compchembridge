import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { CompchemKnowledgeService } from '../services/knowledgeService';

interface QueryKnowledgeGraphContent extends Content {
  query?: string;
}

export const queryKnowledgeGraphAction: Action = {
  name: 'QUERY_KNOWLEDGE_GRAPH',
  similes: [
    'SEARCH_KNOWLEDGE',
    'KNOWLEDGE_STATS',
    'GRAPH_QUERY',
    'KNOWLEDGE_SEARCH',
    'FIND_IN_KNOWLEDGE',
    'KNOWLEDGE_GRAPH_STATS'
  ],
  description: 'Query the computational chemistry knowledge graph for molecular data and statistics',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    const content = message.content as QueryKnowledgeGraphContent;
    const text = content.text?.toLowerCase() || '';
    
    // Check for knowledge graph related keywords
    const keywords = [
      'knowledge', 'graph', 'query', 'search', 'stats', 'statistics',
      'molecules', 'calculations', 'how many', 'show me', 'find',
      'ttl', 'rdf', 'knowledge base'
    ];
    
    return keywords.some(keyword => text.includes(keyword));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: any,
    callback?: HandlerCallback,
    _responses?: Memory[]
  ) => {
    try {
      logger.info('Handling QUERY_KNOWLEDGE_GRAPH action');

      const content = message.content as QueryKnowledgeGraphContent;
      const query = content.query || content.text || 'stats';

      // Get the knowledge service
      const knowledgeService = runtime.getService<CompchemKnowledgeService>('compchem-knowledge');
      
      if (!knowledgeService) {
        const errorContent: Content = {
          text: '❌ Knowledge graph service is not available. Please ensure the service is running.',
          actions: ['QUERY_KNOWLEDGE_GRAPH'],
          source: message.content.source,
        };
        
        if (callback) {
          await callback(errorContent);
        }
        return errorContent;
      }

      let responseText: string;

      // Check if user wants stats or is making a specific query
      if (query.toLowerCase().includes('stat') || query.toLowerCase() === 'stats') {
        // Get knowledge graph statistics
        const stats = await knowledgeService.getKnowledgeGraphStats();
        
        if (stats.error) {
          responseText = `❌ Error getting knowledge graph stats: ${stats.error}`;
        } else {
          responseText = `📊 **Knowledge Graph Statistics**

**File Information:**
- Path: ${stats.file.path}
- Size: ${(stats.file.size / 1024).toFixed(2)} KB
- Last Modified: ${new Date(stats.file.lastModified).toLocaleString()}

**Content Statistics:**
- Total Lines: ${stats.content.totalLines}
- Total RDF Triples: ${stats.content.totalTriples}
- Total Bytes: ${stats.content.totalBytes}

**Molecular Entities:**
- Quantum Calculations: ${stats.entities.molecules}
- SCF Energies: ${stats.entities.scfEnergies}
- HOMO-LUMO Gaps: ${stats.entities.homoLumoGaps}
- Vibrational Frequencies: ${stats.entities.frequencies}
- Atoms: ${stats.entities.atoms}

**Processing Status:**
- Processed Files: ${stats.processing.processedFiles}
${stats.processing.processedFiles > 0 ? `- Files: ${stats.processing.processedFilesList.join(', ')}` : '- No files processed yet'}

🧠 Ready to accept molecular data and build knowledge!`;
        }
      } else {
        // Perform query
        const result = await knowledgeService.queryKnowledgeGraph(query);
        
        if (result.error) {
          responseText = `❌ Error querying knowledge graph: ${result.error}`;
        } else {
          responseText = `🔍 **Query Results for:** "${query}"

**Quick Stats:**
- Total Triples: ${result.stats.totalTriples}
- Molecules: ${result.stats.molecules}
- Atoms: ${result.stats.atoms}
- Processed Files: ${result.stats.processedFiles}

**Search Results:** (${result.totalMatches} matches found)
${result.results.length > 0 ? 
  result.results.map((r: any, i: number) => 
    `${i + 1}. ${r.line} ${r.source ? `(from ${r.source})` : ''}`
  ).join('\n') : 
  'No matches found for your query.'
}

${result.totalMatches > 10 ? '... (showing first 10 results)' : ''}`;
        }
      }

      const responseContent: Content = {
        text: responseText,
        actions: ['QUERY_KNOWLEDGE_GRAPH'],
        source: message.content.source,
      };

      if (callback) {
        await callback(responseContent);
      }

      return responseContent;
    } catch (error) {
      logger.error('Error in QUERY_KNOWLEDGE_GRAPH action:', error);
      
      const errorContent: Content = {
        text: `❌ Failed to query knowledge graph: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: ['QUERY_KNOWLEDGE_GRAPH'],
        source: message.content.source,
      };
      
      if (callback) {
        await callback(errorContent);
      }
      
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Show me knowledge graph statistics',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '📊 **Knowledge Graph Statistics**\n\n**File Information:**\n- Path: ./data/compchem-knowledge-graph.ttl\n- Size: 2.45 KB\n- Last Modified: 2024-01-15 10:30:00\n\n**Content Statistics:**\n- Total Lines: 125\n- Total RDF Triples: 234\n- Total Bytes: 2508\n\n**Molecular Entities:**\n- Quantum Calculations: 3\n- SCF Energies: 3\n- HOMO-LUMO Gaps: 2\n- Vibrational Frequencies: 87\n- Atoms: 45\n\n**Processing Status:**\n- Processed Files: 3\n- Files: lactone.log, TolueneEnergy.log, example.log\n\n🧠 Ready to accept molecular data and build knowledge!',
          actions: ['QUERY_KNOWLEDGE_GRAPH'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Search for energy in the knowledge graph',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🔍 **Query Results for:** "energy"\n\n**Quick Stats:**\n- Total Triples: 234\n- Molecules: 3\n- Atoms: 45\n- Processed Files: 3\n\n**Search Results:** (15 matches found)\n1. ontocompchem:hasSCFEnergy -123.456789 (from lactone.log)\n2. ontocompchem:SCFEnergy ; (from lactone.log)\n3. ontocompchem:hasValue -456.789012 (from TolueneEnergy.log)\n\n... (showing first 10 results)',
          actions: ['QUERY_KNOWLEDGE_GRAPH'],
        },
      },
    ],
  ],
}; 