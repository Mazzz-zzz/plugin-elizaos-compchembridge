#!/usr/bin/env python3
"""
Tests for the Gaussian logfile parser.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from rdflib import Graph

from parse_gaussian import (
    gaussian_to_dict,
    dict_to_graph,
    CalculationMetadata,
    main
)


class TestGaussianParser:
    """Test the Gaussian logfile parsing functionality."""

    def test_basic_parsing(self):
        """Test basic parsing of a simple Gaussian log."""
        # Create a minimal test Gaussian log file
        test_log_content = """
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
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.log', delete=False) as f:
            f.write(test_log_content)
            test_file_path = f.name
        
        try:
            # This would normally work with a real Gaussian file
            # For now, we'll test the structure
            with patch('cclib.io.ccread') as mock_ccread:
                # Mock cclib data object
                mock_data = type('MockData', (), {})()
                mock_data.metadata = {
                    'methods': ['B3LYP'],
                    'basis_set': '6-31G(d)',
                    'finished': True
                }
                mock_data.scfenergies = [-40.5180970716]
                mock_data.atomnos = [6, 1, 1, 1, 1]  # C, H, H, H, H
                mock_data.atomcoords = [[
                    [0.0, 0.0, 0.0],
                    [1.089, 0.0, 0.0],
                    [-0.363, 1.026719, 0.0],
                    [-0.363, -0.51336, -0.889165],
                    [-0.363, -0.51336, 0.889165]
                ]]
                mock_data.charge = 0
                mock_data.mult = 1
                
                mock_ccread.return_value = mock_data
                
                result = gaussian_to_dict(test_file_path)
                
                assert result['method'] == 'B3LYP'
                assert result['basis'] == '6-31G(d)'
                assert result['scf_energy'] == -40.5180970716
                assert result['converged'] is True
                assert len(result['atoms']) == 5
                assert len(result['coordinates']) == 5
        
        finally:
            Path(test_file_path).unlink()

    def test_metadata_handling(self):
        """Test metadata parsing and validation."""
        metadata_dict = {
            'filename': 'test_calc.log',
            'timestamp': '2023-10-25T12:00:00Z',
            'software_version': '16.C.01'
        }
        
        metadata = CalculationMetadata(**metadata_dict)
        
        assert metadata.filename == 'test_calc.log'
        assert metadata.timestamp == '2023-10-25T12:00:00Z'
        assert metadata.software_version == '16.C.01'
        assert metadata.parser_version == '0.1.0'

    def test_rdf_generation(self):
        """Test RDF graph generation from parsed data."""
        calc_data = {
            'method': 'B3LYP',
            'basis': '6-31G(d)',
            'scf_energy': -40.518,
            'atoms': [6, 1, 1, 1, 1],
            'coordinates': [
                [0.0, 0.0, 0.0],
                [1.089, 0.0, 0.0],
                [-0.363, 1.027, 0.0],
                [-0.363, -0.513, -0.889],
                [-0.363, -0.513, 0.889]
            ],
            'converged': True,
            'charge': 0,
            'multiplicity': 1
        }
        
        metadata = CalculationMetadata(
            filename='methane_test.log',
            software_version='16.C.01'
        )
        
        file_uri = 'https://example.org/gaussian/methane_test'
        
        graph = dict_to_graph(calc_data, file_uri, metadata)
        
        # Check that we have an RDF graph
        assert isinstance(graph, Graph)
        
        # Check that the graph has content
        assert len(graph) > 0
        
        # Serialize to turtle and check for key content
        turtle_output = graph.serialize(format='turtle')
        
        assert 'QuantumCalculation' in turtle_output
        assert 'B3LYP' in turtle_output
        assert '6-31G(d)' in turtle_output
        assert '-40.518' in turtle_output
        assert 'methane_test.log' in turtle_output

    def test_rdf_namespaces(self):
        """Test that proper ontology namespaces are used."""
        calc_data = {
            'method': 'HF',
            'basis': 'STO-3G',
            'scf_energy': -74.96,
            'converged': True
        }
        
        metadata = CalculationMetadata()
        file_uri = 'https://example.org/test'
        
        graph = dict_to_graph(calc_data, file_uri, metadata)
        turtle_output = graph.serialize(format='turtle')
        
        # Check for proper namespace prefixes
        assert '@prefix ontocompchem:' in turtle_output
        assert '@prefix cheminf:' in turtle_output
        assert '@prefix prov:' in turtle_output
        assert '@prefix ex:' in turtle_output

    def test_error_handling(self):
        """Test error handling for invalid files."""
        with pytest.raises(RuntimeError):
            gaussian_to_dict('/nonexistent/file.log')

    def test_empty_data_handling(self):
        """Test handling of empty or minimal calculation data."""
        calc_data = {}
        metadata = CalculationMetadata()
        file_uri = 'https://example.org/empty'
        
        # Should not crash with empty data
        graph = dict_to_graph(calc_data, file_uri, metadata)
        assert isinstance(graph, Graph)
        
        turtle_output = graph.serialize(format='turtle')
        assert 'QuantumCalculation' in turtle_output

    def test_cli_interface(self):
        """Test the command line interface."""
        test_args = [
            'parse_gaussian.py',
            '/fake/path.log',
            '{"filename": "test.log"}',
            '--format', 'turtle'
        ]
        
        with patch('sys.argv', test_args):
            with patch('parse_gaussian.gaussian_to_dict') as mock_parse:
                with patch('builtins.print') as mock_print:
                    mock_parse.return_value = {
                        'method': 'HF',
                        'scf_energy': -1.0,
                        'converged': True
                    }
                    
                    try:
                        main()
                    except SystemExit:
                        pass  # Expected for successful runs
                    
                    # Check that output was generated
                    mock_print.assert_called()
                    output = mock_print.call_args[0][0]
                    assert '@prefix' in output
                    assert 'QuantumCalculation' in output


class TestIntegration:
    """Integration tests for the complete pipeline."""

    def test_full_pipeline_mock(self):
        """Test the complete parsing pipeline with mocked cclib."""
        test_content = """
 Entering Gaussian System, Link 0=g16
 # HF/STO-3G
 
 Water molecule
 
 0 1
 O      0.000000    0.000000    0.000000
 H      0.757000    0.586000    0.000000
 H     -0.757000    0.586000    0.000000
 
 SCF Done:  E(RHF) =    -74.9659012      A.U. after    5 cycles
 
 Normal termination of Gaussian 16.
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.log', delete=False) as f:
            f.write(test_content)
            test_file_path = f.name
        
        try:
            with patch('cclib.io.ccread') as mock_ccread:
                # Mock a water molecule calculation
                mock_data = type('MockData', (), {})()
                mock_data.metadata = {
                    'methods': ['HF'],
                    'basis_set': 'STO-3G',
                    'finished': True
                }
                mock_data.scfenergies = [-74.9659012]
                mock_data.atomnos = [8, 1, 1]  # O, H, H
                mock_data.atomcoords = [[
                    [0.0, 0.0, 0.0],
                    [0.757, 0.586, 0.0],
                    [-0.757, 0.586, 0.0]
                ]]
                mock_data.charge = 0
                mock_data.mult = 1
                
                mock_ccread.return_value = mock_data
                
                # Test parsing
                calc_data = gaussian_to_dict(test_file_path)
                
                # Test RDF generation
                metadata = CalculationMetadata(filename='water.log')
                graph = dict_to_graph(calc_data, 'https://example.org/water', metadata)
                
                # Verify the complete pipeline
                turtle_output = graph.serialize(format='turtle')
                
                assert 'HF' in turtle_output
                assert 'STO-3G' in turtle_output
                assert '-74.9659012' in turtle_output
                assert 'water.log' in turtle_output
                assert len(graph) > 10  # Should have many triples
        
        finally:
            Path(test_file_path).unlink()


if __name__ == '__main__':
    pytest.main([__file__]) 