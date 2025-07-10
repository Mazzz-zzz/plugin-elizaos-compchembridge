import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { CompchemKnowledgeService } from '../services/knowledgeService';
import { createMockRuntime } from './test-utils';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@elizaos/core';

// Test configuration
const testDataDir = './test-data';
const testKnowledgeGraphPath = path.join(testDataDir, 'test-knowledge-graph.ttl');

describe('Knowledge Graph Service', () => {
  let mockRuntime: any;
  let knowledgeService: CompchemKnowledgeService;

  beforeAll(async () => {
    // Setup test environment
    mockRuntime = createMockRuntime({
      getSetting: (key: string) => {
        if (key === 'COMPCHEM_DATA_DIR') return testDataDir;
        return null;
      }
    });

    // Ensure test directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Clean up any existing test file
    if (fs.existsSync(testKnowledgeGraphPath)) {
      fs.unlinkSync(testKnowledgeGraphPath);
    }

    // Initialize knowledge service
    knowledgeService = new CompchemKnowledgeService(mockRuntime);
    await knowledgeService.initialize(mockRuntime);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testKnowledgeGraphPath)) {
      fs.unlinkSync(testKnowledgeGraphPath);
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
  });

  it('should initialize and create knowledge graph file', async () => {
    expect(fs.existsSync(testKnowledgeGraphPath)).toBe(true);
    
    const content = fs.readFileSync(testKnowledgeGraphPath, 'utf-8');
    expect(content).toContain('@prefix cheminf:');
    expect(content).toContain('@prefix ontocompchem:');
    expect(content).toContain('ex:knowledgeBase a ontocompchem:KnowledgeBase');
  });

  it('should get initial knowledge graph statistics', async () => {
    const stats = await knowledgeService.getKnowledgeGraphStats();
    
    expect(stats.error).toBeUndefined();
    expect(stats.file.path).toBe(testKnowledgeGraphPath);
    expect(stats.content.totalLines).toBeGreaterThan(0);
    expect(stats.entities.molecules).toBe(0); // No molecules added yet
    expect(stats.processing.processedFiles).toBe(0);
  });

  it('should add RDF data to knowledge graph', async () => {
    const sampleRDF = `ex:testMolecule a ontocompchem:QuantumCalculation ;
    ontocompchem:hasNAtoms 5 ;
    ontocompchem:hasMolecularFormula "H2O" .

ex:testMolecule/scf_1 a ontocompchem:SCFEnergy ;
    ontocompchem:hasValue -76.123456 ;
    ontocompchem:belongsTo ex:testMolecule .
`;

    await knowledgeService.addKnowledgeData(sampleRDF, 'test.log');
    
    // Check that the data was added
    const content = fs.readFileSync(testKnowledgeGraphPath, 'utf-8');
    expect(content).toContain('ex:testMolecule a ontocompchem:QuantumCalculation');
    expect(content).toContain('# Data from: test.log');
    
    // Check processed files tracking
    expect(knowledgeService.isFileProcessed('test.log')).toBe(true);
  });

  it('should prevent duplicate file processing', async () => {
    const sampleRDF = `ex:duplicateTest a ontocompchem:QuantumCalculation .`;
    
    // Add the same file again
    await knowledgeService.addKnowledgeData(sampleRDF, 'test.log');
    
    // Should not add duplicate data
    const content = fs.readFileSync(testKnowledgeGraphPath, 'utf-8');
    const matches = content.match(/# Data from: test\.log/g);
    expect(matches?.length).toBe(1); // Should only appear once
  });

  it('should query knowledge graph', async () => {
    const result = await knowledgeService.queryKnowledgeGraph('testMolecule');
    
    expect(result.error).toBeUndefined();
    expect(result.query).toBe('testMolecule');
    expect(result.stats).toBeDefined();
    expect(result.stats.molecules).toBe(1); // Now we should have 1 molecule
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].line).toContain('testMolecule');
  });

  it('should get updated statistics after adding data', async () => {
    const stats = await knowledgeService.getKnowledgeGraphStats();
    
    expect(stats.error).toBeUndefined();
    expect(stats.entities.molecules).toBe(1); // 1 molecule added
    expect(stats.entities.scfEnergies).toBe(1); // 1 SCF energy added
    expect(stats.processing.processedFiles).toBe(1); // 1 file processed
    expect(stats.processing.processedFilesList).toContain('test.log');
  });

  it('should handle search queries with no results', async () => {
    const result = await knowledgeService.queryKnowledgeGraph('nonexistent');
    
    expect(result.error).toBeUndefined();
    expect(result.query).toBe('nonexistent');
    expect(result.totalMatches).toBe(0);
    expect(result.results.length).toBe(0);
  });

  it('should get knowledge graph content', async () => {
    const content = await knowledgeService.getKnowledgeGraphContent();
    
    expect(content).toContain('@prefix cheminf:');
    expect(content).toContain('ex:testMolecule');
    expect(content).toContain('# Data from: test.log');
  });

  it('should handle large RDF data correctly', async () => {
    // Create a larger RDF dataset
    let largeRDF = '';
    for (let i = 1; i <= 10; i++) {
      largeRDF += `ex:molecule${i} a ontocompchem:QuantumCalculation ;
    ontocompchem:hasNAtoms ${i * 2} ;
    ontocompchem:hasMolecularFormula "C${i}H${i*2}" .

`;
    }

    await knowledgeService.addKnowledgeData(largeRDF, 'large-dataset.log');
    
    const stats = await knowledgeService.getKnowledgeGraphStats();
    expect(stats.entities.molecules).toBe(11); // 1 + 10 new molecules
    expect(stats.processing.processedFiles).toBe(2); // test.log + large-dataset.log
  });
}); 