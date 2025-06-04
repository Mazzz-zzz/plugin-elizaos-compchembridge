# API Reference

This document provides detailed technical documentation for the Gaussian Knowledge Graph plugin's APIs, interfaces, and extension points.

## 🎭 Actions

### queryGaussianKnowledgeAction

The main action that enables natural language queries about Gaussian computational chemistry data.

#### Action Definition

```typescript
export const queryGaussianKnowledgeAction: Action = {
    name: "QUERY_GAUSSIAN_KNOWLEDGE",
    similes: [
        "ASK_ABOUT_CALCULATIONS",
        "SEARCH_QUANTUM_DATA", 
        "FIND_MOLECULAR_DATA",
        "GET_CALCULATION_INFO",
        "SHOW_KNOWLEDGE_STATS",
        "WHAT_CALCULATIONS",
        "HOW_MANY_MOLECULES"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean>,
    description: "Query the accumulated Gaussian knowledge graph to answer questions about calculations, molecules, and energies",
    handler: async (runtime, message, state?, options?, callback?) => Promise<unknown>,
    examples: ActionExample[][]
}
```

#### Validation Logic

The action triggers when the user message contains chemistry-related keywords:

```typescript
const queryKeywords = [
    'how many', 'what', 'show me', 'find', 'search', 'tell me about',
    'energy', 'energies', 'molecule', 'molecules', 'calculation', 'calculations',
    'homo', 'lumo', 'gap', 'frequency', 'frequencies', 'atom', 'atoms',
    'scf', 'dft', 'basis', 'method', 'gaussian', 'quantum', 'knowledge graph',
    'stats', 'statistics', 'summary'
];

return queryKeywords.some(keyword => text.includes(keyword));
```

#### Handler Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `runtime` | `IAgentRuntime` | Eliza runtime instance with access to services |
| `message` | `Memory` | User message containing the query |
| `state` | `State?` | Current conversation state (optional) |
| `options` | `{ [key: string]: unknown }?` | Additional options (optional) |
| `callback` | `HandlerCallback?` | Response callback function (optional) |

#### Response Format

The handler returns structured responses based on query type:

##### Statistical Summary
```typescript
interface StatisticalResponse {
    fileSize: number;           // Knowledge graph file size in bytes
    totalTriples: number;       // RDF triples count
    molecules: number;          // Analyzed molecules count
    scfEnergies: number;        // SCF energies count
    homoLumoGaps: number;      // HOMO-LUMO gaps count
    frequencies: number;        // Vibrational frequencies count
    atoms: number;             // Total atoms count
    processedFiles: number;     // Processed files count
    lastModified: Date;        // Last modification timestamp
}
```

##### Query Results
```typescript
interface QueryResponse {
    stats: {
        totalTriples: number;
        molecules: number;
        scfEnergies: number;
        frequencies: number;
        atoms: number;
    };
    relevantData: string[];     // Matching RDF triples
    query: string;              // Original query text
}
```

#### Error Handling

```typescript
// Service not available
{
    text: "❌ Gaussian knowledge service is not available. Please ensure the knowledge graph is initialized."
}

// Query processing error
{
    text: `❌ Error processing your query: ${error.message}`
}

// Knowledge graph error
{
    error: string;              // Error message from service
}
```

## 🔧 Services

### GaussianKnowledgeService

Background service that monitors files and maintains the knowledge graph.

#### Class Definition

```typescript
export class GaussianKnowledgeService extends Service {
    capabilityDescription = "Automatically monitors example_logs directory, parses Gaussian files, and maintains a persistent knowledge graph for querying";
    
    // Static factory method
    static async start(runtime: IAgentRuntime): Promise<GaussianKnowledgeService>;
    
    // Required Service interface methods
    async initialize(runtime: IAgentRuntime): Promise<void>;
    async stop(): Promise<void>;
    
    // Plugin-specific methods
    async queryKnowledgeGraph(query: string): Promise<QueryResponse | ErrorResponse>;
    async getKnowledgeGraphStats(): Promise<StatisticalResponse | ErrorResponse>;
}
```

#### Configuration Properties

```typescript
interface ServiceConfiguration {
    knowledgeGraphPath: string;     // Path to knowledge graph file
    watchedDirectory: string;       // Directory to monitor for Gaussian files
    processedFiles: Set<string>;    // Cache of processed files
    isInitialized: boolean;         // Initialization status
}
```

#### File Processing Pipeline

```typescript
interface ProcessingPipeline {
    // 1. File Detection
    startFileWatcher(): void;
    
    // 2. File Processing
    processGaussianFile(filePath: string): Promise<void>;
    
    // 3. RDF Generation
    appendToKnowledgeGraph(rdfContent: string, sourcePath: string): Promise<void>;
    
    // 4. Knowledge Graph Updates
    loadOrCreateKnowledgeGraph(): Promise<void>;
}
```

#### Query Methods

##### queryKnowledgeGraph()

```typescript
async queryKnowledgeGraph(query: string): Promise<QueryResponse | ErrorResponse>
```

**Parameters:**
- `query`: Natural language query string

**Returns:**
- `QueryResponse`: Statistical data and relevant RDF triples
- `ErrorResponse`: Error details if processing fails

**Implementation:**
```typescript
// Basic statistics extraction
const stats = {
    totalTriples: (content.match(/\./g) || []).length,
    molecules: (content.match(/ontocompchem:QuantumCalculation/g) || []).length,
    scfEnergies: (content.match(/ontocompchem:hasSCFEnergy/g) || []).length,
    frequencies: (content.match(/ontocompchem:hasFrequency/g) || []).length,
    atoms: (content.match(/cheminf:hasAtom/g) || []).length
};

// Text-based search for relevant data
const relevantLines = lines.filter(line => 
    line.toLowerCase().includes(queryLower) ||
    (queryLower.includes('energy') && line.includes('ontocompchem:hasSCFEnergy')) ||
    (queryLower.includes('homo') && line.includes('ontocompchem:hasHOMOLUMOGap')) ||
    // ... other pattern matches
);
```

##### getKnowledgeGraphStats()

```typescript
async getKnowledgeGraphStats(): Promise<StatisticalResponse | ErrorResponse>
```

**Returns complete statistical overview:**
```typescript
{
    fileSize: number;              // File size in bytes
    totalTriples: number;          // Total RDF triples
    molecules: number;             // Molecule count
    scfEnergies: number;          // SCF energy count
    homoLumoGaps: number;         // HOMO-LUMO gap count
    frequencies: number;           // Frequency count
    atoms: number;                // Atom count
    processedFiles: number;       // Processed file count
    lastModified: Date;           // Last modification time
}
```

#### File Monitoring

##### Supported File Types

```typescript
const supportedExtensions = ['.log', '.out'];

// File detection logic
if (!filename.toLowerCase().endsWith('.log') && 
    !filename.toLowerCase().endsWith('.out')) {
    return; // Skip non-Gaussian files
}
```

##### Processing Events

```typescript
interface ProcessingEvents {
    'file-detected': (filename: string) => void;
    'processing-started': (filepath: string) => void;
    'processing-completed': (filepath: string, tripleCount: number) => void;
    'processing-error': (filepath: string, error: Error) => void;
}
```

## 🔌 Plugin Integration

### Plugin Configuration

```typescript
const gaussianKnowledgeGraphPlugin: Plugin = {
    name: "gaussian-kg",
    description: "Automatically monitors example_logs directory, parses Gaussian files, and maintains a persistent knowledge graph for natural language querying",
    actions: [queryGaussianKnowledgeAction],
    evaluators: [],
    providers: [],
};
```

### Initialization Function

```typescript
export async function initializeGaussianKnowledgePlugin(runtime: IAgentRuntime): Promise<void> {
    try {
        const service = await GaussianKnowledgeService.start(runtime);
        runtime.services.set("gaussian-knowledge", service);
        console.log("✅ Gaussian Knowledge Plugin initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize Gaussian Knowledge Plugin:", error);
    }
}
```

### Service Registration

```typescript
// Manual service registration approach
runtime.services.set("gaussian-knowledge", service);

// Service retrieval in actions
const knowledgeService = runtime.services.get("gaussian-knowledge" as any) as any;
```

## 🎨 Ontology and Data Model

### RDF Namespaces

```turtle
@prefix cheminf: <http://semanticscience.org/resource/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix ex: <https://example.org/gaussian#> .
@prefix ontocompchem: <http://www.theworldavatar.com/ontology/ontocompchem/> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

### Data Types Modeled

#### Molecular Properties

```turtle
# SCF Energy
ontocompchem:hasSCFEnergy [
    a ontocompchem:SCFEnergy ;
    ontocompchem:hasValue "-154.28377"^^xsd:double ;
] .

# HOMO-LUMO Gap
ontocompchem:hasHOMOLUMOGap [
    a ontocompchem:HOMOLUMOGap ;
    ontocompchem:hasValue "0.2534"^^xsd:double ;
] .

# Vibrational Frequency
ontocompchem:hasFrequency [
    a ontocompchem:VibrationalFrequency ;
    ontocompchem:hasValue "3156.23"^^xsd:double ;
] .

# Atomic Structure
cheminf:hasAtom [
    a cheminf:Atom ;
    cheminf:hasAtomicSymbol "C" ;
    cheminf:hasAtomicNumber "6"^^xsd:integer ;
] .
```

#### Calculation Metadata

```turtle
# Quantum Calculation
ex:calculation_001 a ontocompchem:QuantumCalculation ;
    dcterms:created "2025-01-02T14:30:15Z"^^xsd:dateTime ;
    dcterms:source "TolueneEnergy.log" ;
    prov:wasGeneratedBy ex:gaussian_process .
```

## 🔄 Extension Points

### Adding New Data Types

To support additional Gaussian output data:

1. **Update Python Parser**: Modify `parse_gaussian.py` to extract new data types
2. **Extend Ontology**: Add new RDF predicates and classes
3. **Update Query Logic**: Add keyword recognition for new data types
4. **Enhance Statistics**: Include new data in statistical summaries

#### Example: Adding Dipole Moments

```typescript
// 1. Update validation keywords
const queryKeywords = [
    // ... existing keywords
    'dipole', 'dipoles', 'moment', 'moments'
];

// 2. Update statistics extraction
const stats = {
    // ... existing stats
    dipoleMoments: (content.match(/ontocompchem:hasDipoleMoment/g) || []).length
};

// 3. Update query matching
const relevantLines = lines.filter(line => 
    // ... existing filters
    (queryLower.includes('dipole') && line.includes('ontocompchem:hasDipoleMoment'))
);
```

### Custom Query Handlers

Create specialized query handlers for specific use cases:

```typescript
interface CustomQueryHandler {
    name: string;
    validate: (query: string) => boolean;
    execute: (query: string, knowledgeGraph: string) => Promise<any>;
}

// Example: Comparative analysis handler
const comparativeHandler: CustomQueryHandler = {
    name: "COMPARATIVE_ANALYSIS",
    validate: (query) => query.includes("compare") || query.includes("versus"),
    execute: async (query, kg) => {
        // Custom comparison logic
    }
};
```

### Alternative Storage Backends

Replace file-based storage with databases:

```typescript
interface StorageBackend {
    initialize(): Promise<void>;
    store(triples: string[]): Promise<void>;
    query(pattern: string): Promise<string[]>;
    getStatistics(): Promise<StatisticalResponse>;
}

// Example: SPARQL endpoint backend
class SPARQLBackend implements StorageBackend {
    constructor(private endpoint: string) {}
    
    async query(sparqlQuery: string): Promise<string[]> {
        // Execute SPARQL query against endpoint
    }
}
```

## 🧪 Testing Interfaces

### Mock Service for Testing

```typescript
export class MockGaussianKnowledgeService extends GaussianKnowledgeService {
    private mockData: any = {};
    
    async queryKnowledgeGraph(query: string): Promise<any> {
        return this.mockData.queryResponse || { stats: {}, relevantData: [] };
    }
    
    async getKnowledgeGraphStats(): Promise<any> {
        return this.mockData.statsResponse || { totalTriples: 0 };
    }
    
    setMockData(data: any): void {
        this.mockData = data;
    }
}
```

### Action Testing Utilities

```typescript
export async function testQueryAction(
    query: string, 
    mockService?: MockGaussianKnowledgeService
): Promise<any> {
    const mockRuntime = createMockRuntime();
    if (mockService) {
        mockRuntime.services.set("gaussian-knowledge", mockService);
    }
    
    const mockMessage = createMockMessage(query);
    
    return await queryGaussianKnowledgeAction.handler(
        mockRuntime, 
        mockMessage
    );
}
```

## 📊 Performance Considerations

### Memory Usage

```typescript
// Service memory footprint
interface MemoryUsage {
    processedFilesCache: number;    // Set<string> size
    knowledgeGraphSize: number;     // File size in memory
    runtimeOverhead: number;        // Service object overhead
}
```

### Query Performance

```typescript
// Query optimization strategies
interface QueryOptimization {
    indexing: boolean;              // Pre-built content indices
    caching: boolean;               // Query result caching
    streaming: boolean;             // Stream large result sets
    pagination: boolean;            // Paginate large responses
}
```

### Scalability Limits

```typescript
// Current limitations and thresholds
interface ScalabilityLimits {
    maxFileSize: number;            // ~100MB per Gaussian file
    maxTotalTriples: number;        // ~1M triples in memory
    maxConcurrentFiles: number;     // ~10 files processing simultaneously
    queryTimeout: number;           // 30 seconds max query time
}
```

---

*For implementation details, see the source code in `src/plugin-gaussian-kg/`. For usage examples, check the [Usage Examples](usage-examples.md).* 