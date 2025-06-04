/**
 * Type definitions for the Query Gaussian Knowledge action
 */

import { Content } from "@elizaos/core";

/**
 * Content interface for Gaussian knowledge queries
 */
export interface QueryGaussianKnowledgeContent extends Content {
  text: string;
}

/**
 * Response interface for the action handler
 */
export interface QueryResponse {
  text: string;
  success: boolean;
}

/**
 * Knowledge graph statistics interface
 */
export interface KnowledgeGraphStats {
  fileSize: number;
  totalTriples: number;
  molecules: number;
  scfEnergies: number;
  homoLumoGaps: number;
  frequencies: number;
  atoms: number;
  processedFiles: number;
  lastModified: number;
  error?: string;
}

/**
 * Query result interface
 */
export interface QueryResult {
  stats: {
    molecules: number;
    scfEnergies: number;
    frequencies: number;
    atoms: number;
  };
  relevantData?: string[];
  error?: string;
}

/**
 * Gaussian knowledge service interface
 */
export interface GaussianKnowledgeService {
  getKnowledgeGraphStats(): Promise<KnowledgeGraphStats>;
  queryKnowledgeGraph(query: string): Promise<QueryResult>;
}

/**
 * Query keywords for validation
 */
export const QUERY_KEYWORDS = [
  "how many",
  "what",
  "show me",
  "find",
  "search",
  "tell me about",
  "energy",
  "energies",
  "molecule",
  "molecules",
  "calculation",
  "calculations",
  "homo",
  "lumo",
  "gap",
  "frequency",
  "frequencies",
  "atom",
  "atoms",
  "scf",
  "dft",
  "basis",
  "method",
  "gaussian",
  "quantum",
  "knowledge graph",
  "stats",
  "statistics",
  "summary",
] as const;

/**
 * Action similes
 */
export const ACTION_SIMILES = [
  "ASK_ABOUT_CALCULATIONS",
  "SEARCH_QUANTUM_DATA",
  "FIND_MOLECULAR_DATA",
  "GET_CALCULATION_INFO",
  "SHOW_KNOWLEDGE_STATS",
  "WHAT_CALCULATIONS",
  "HOW_MANY_MOLECULES",
] as const;
