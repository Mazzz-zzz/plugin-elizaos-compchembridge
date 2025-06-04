import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { promises as fs } from "fs";

const execFileAsync = promisify(execFile);

describe("Gaussian KG Plugin", () => {
  const testDataDir = path.join(__dirname, "data");
  const pythonScript = path.join(__dirname, "../py/parse_gaussian.py");

  beforeAll(async () => {
    // Ensure test data directory exists
    try {
      await fs.access(testDataDir);
    } catch {
      await fs.mkdir(testDataDir, { recursive: true });
    }
  });

  describe("Python Parser", () => {
    it("should parse a simple Gaussian logfile", async () => {
      // Create a minimal test Gaussian log file
      const testLogContent = `
 Entering Gaussian System, Link 0=g16
 %mem=1GB
 %nprocshared=4
 Will use up to    4 processors via shared memory.
 
 # B3LYP/6-31G(d) opt freq
 
 Test molecule
 
 0 1
 C      0.000000    0.000000    0.000000
 H      1.089000    0.000000    0.000000
 H     -0.363000    1.026719    0.000000
 H     -0.363000   -0.513360   -0.889165
 H     -0.363000   -0.513360    0.889165
 
 SCF Done:  E(RB3LYP) =    -40.5180970716     A.U. after    8 cycles
 
 Normal termination of Gaussian 16 at Wed Oct 25 12:00:00 2023.
`;

      const testLogPath = path.join(testDataDir, "test_methane.log");
      await fs.writeFile(testLogPath, testLogContent);

      // Test the Python parser
      const { stdout } = await execFileAsync("python", [
        pythonScript,
        testLogPath,
        '{"filename": "test_methane.log", "software_version": "16"}'
      ]);

      expect(stdout).toContain("@prefix");
      expect(stdout).toContain("ontocompchem:");
      expect(stdout).toContain("QuantumCalculation");
      expect(stdout).toContain("B3LYP");
      expect(stdout).toContain("-40.5180970716");

      // Clean up
      await fs.unlink(testLogPath);
    }, 30000); // 30 second timeout for file operations

    it("should handle missing files gracefully", async () => {
      const nonExistentFile = path.join(testDataDir, "nonexistent.log");
      
      await expect(
        execFileAsync("python", [pythonScript, nonExistentFile, "{}"])
      ).rejects.toThrow();
    });

    it("should validate metadata parsing", async () => {
      const testLogContent = `
 Entering Gaussian System, Link 0=g16
 # HF/STO-3G
 
 Water molecule
 
 0 1
 O      0.000000    0.000000    0.000000
 H      0.757000    0.586000    0.000000
 H     -0.757000    0.586000    0.000000
 
 SCF Done:  E(RHF) =    -74.9659012      A.U. after    5 cycles
 
 Normal termination of Gaussian 16.
`;

      const testLogPath = path.join(testDataDir, "test_water.log");
      await fs.writeFile(testLogPath, testLogContent);

      const metadata = {
        filename: "water_calc.log",
        timestamp: "2023-10-25T12:00:00Z",
        software_version: "16.C.01"
      };

      const { stdout } = await execFileAsync("python", [
        pythonScript,
        testLogPath,
        JSON.stringify(metadata)
      ]);

      expect(stdout).toContain("water_calc.log");
      expect(stdout).toContain("2023-10-25T12:00:00Z");
      expect(stdout).toContain("HF");
      expect(stdout).toContain("-74.9659012");

      // Clean up
      await fs.unlink(testLogPath);
    }, 30000);
  });

  describe("RDF Output Validation", () => {
    it("should produce valid RDF triples", async () => {
      const testLogContent = `
 Entering Gaussian System, Link 0=g16
 # B3LYP/6-31G(d)
 
 Benzene
 
 0 1
 C      0.000000    1.396000    0.000000
 C      1.209000    0.698000    0.000000
 C      1.209000   -0.698000    0.000000
 C      0.000000   -1.396000    0.000000
 C     -1.209000   -0.698000    0.000000
 C     -1.209000    0.698000    0.000000
 H      0.000000    2.479000    0.000000
 H      2.147000    1.240000    0.000000
 H      2.147000   -1.240000    0.000000
 H      0.000000   -2.479000    0.000000
 H     -2.147000   -1.240000    0.000000
 H     -2.147000    1.240000    0.000000
 
 SCF Done:  E(RB3LYP) =   -232.2438745     A.U. after   12 cycles
 
 Normal termination of Gaussian 16.
`;

      const testLogPath = path.join(testDataDir, "test_benzene.log");
      await fs.writeFile(testLogPath, testLogContent);

      const { stdout } = await execFileAsync("python", [
        pythonScript,
        testLogPath,
        "{}"
      ]);

      // Check for valid RDF structure
      const lines = stdout.split('\n').filter(line => line.trim().length > 0);
      expect(lines.length).toBeGreaterThan(10); // Should have many triples
      
      // Check for proper RDF syntax
      const triplePattern = /^\s*[<@]|\s+[a-zA-Z:]+\s+/; // Basic RDF triple pattern
      const validTriples = lines.filter(line => triplePattern.test(line));
      expect(validTriples.length).toBeGreaterThan(5);

      // Check for key ontology elements
      expect(stdout).toContain("QuantumCalculation");
      expect(stdout).toContain("MolecularStructure");
      expect(stdout).toContain("ComputationalMethod");

      // Clean up
      await fs.unlink(testLogPath);
    }, 30000);
  });
});

export {}; 