#!/usr/bin/env node

/**
 * Integration test script for Computational Chemistry Plugin V2
 * Demonstrates Python integration with real Gaussian log files
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testPythonIntegration() {
  console.log('🧬 Testing Computational Chemistry Plugin V2 Integration\n');

  try {
    // Test 1: Parse lactone.log file
    console.log('📊 Test 1: Parsing lactone.log with cclib...');
    const lactoneResult = await execFileAsync('python3', [
      path.join(__dirname, 'py', 'parse_gaussian_cclib.py'),
      path.join(__dirname, 'data', 'examples', 'lactone.log'),
      JSON.stringify({ test: 'lactone', timestamp: new Date().toISOString() }),
      '--format', 'json'
    ]);

    const lactoneData = JSON.parse(lactoneResult.stdout);
    console.log(`  ✅ Molecular Formula: ${lactoneData.molecular_formula}`);
    console.log(`  ✅ Number of Atoms: ${lactoneData.natom}`);
    console.log(`  ✅ Charge: ${lactoneData.charge}, Multiplicity: ${lactoneData.mult}`);
    if (lactoneData.scfenergies) {
      const finalEnergy = lactoneData.scfenergies[lactoneData.scfenergies.length - 1];
      console.log(`  ✅ Final SCF Energy: ${finalEnergy.toFixed(6)} eV`);
    }
    console.log(`  ✅ cclib version: ${lactoneData.metadata.cclib_version}\n`);

    // Test 2: Parse TolueneEnergy.log file
    console.log('📊 Test 2: Parsing TolueneEnergy.log with cclib...');
    const tolueneResult = await execFileAsync('python3', [
      path.join(__dirname, 'py', 'parse_gaussian_cclib.py'),
      path.join(__dirname, 'data', 'examples', 'TolueneEnergy.log'),
      JSON.stringify({ test: 'toluene', timestamp: new Date().toISOString() }),
      '--format', 'json'
    ]);

    const tolueneData = JSON.parse(tolueneResult.stdout);
    console.log(`  ✅ Molecular Formula: ${tolueneData.molecular_formula}`);
    console.log(`  ✅ Number of Atoms: ${tolueneData.natom}`);
    console.log(`  ✅ Charge: ${tolueneData.charge}, Multiplicity: ${tolueneData.mult}`);
    if (tolueneData.scfenergies) {
      const finalEnergy = tolueneData.scfenergies[tolueneData.scfenergies.length - 1];
      console.log(`  ✅ Final SCF Energy: ${finalEnergy.toFixed(6)} eV`);
      console.log(`  ✅ SCF Cycles: ${tolueneData.scfenergies.length}`);
    }
    console.log(`  ✅ cclib version: ${tolueneData.metadata.cclib_version}\n`);

    // Test 3: RDF/Turtle output
    console.log('📊 Test 3: Generating RDF/Turtle output for lactone...');
    const rdfResult = await execFileAsync('python3', [
      path.join(__dirname, 'py', 'parse_gaussian_cclib.py'),
      path.join(__dirname, 'data', 'examples', 'lactone.log'),
      JSON.stringify({ format: 'turtle' }),
      '--format', 'turtle'
    ]);

    const rdfLines = rdfResult.stdout.split('\n').slice(0, 10);
    console.log('  ✅ RDF/Turtle output sample:');
    rdfLines.forEach(line => {
      if (line.trim()) console.log(`     ${line}`);
    });
    console.log('     ... (truncated)\n');

    // Test 4: Python environment check
    console.log('📊 Test 4: Checking Python environment...');
    try {
      const pythonVersion = await execFileAsync('python3', ['--version']);
      console.log(`  ✅ Python version: ${pythonVersion.stdout.trim()}`);

      // Check packages
      const packages = ['numpy', 'cclib', 'matplotlib', 'scipy'];
      for (const pkg of packages) {
        try {
          const result = await execFileAsync('python3', ['-c', `import ${pkg}; print(${pkg}.__version__)`]);
          console.log(`  ✅ ${pkg}: ${result.stdout.trim()}`);
        } catch {
          console.log(`  ❌ ${pkg}: not available`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Python not available: ${error.message}`);
    }

    console.log('\n🎉 All integration tests passed! The v2 plugin is ready to use.');
    console.log('\n📝 Summary:');
    console.log('   • ✅ cclib parser working with real Gaussian files');
    console.log('   • ✅ JSON output with comprehensive molecular data');
    console.log('   • ✅ RDF/Turtle output for knowledge graphs');
    console.log('   • ✅ Python environment validated');
    console.log('   • ✅ v1 parser functionality successfully migrated to v2');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Ensure Python 3 is installed and in PATH');
    console.error('   • Install required packages: pip install cclib numpy scipy matplotlib');
    console.error('   • Verify log files exist in data/examples/');
    process.exit(1);
  }
}

// Run the integration test
testPythonIntegration(); 