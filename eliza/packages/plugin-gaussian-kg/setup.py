#!/usr/bin/env python3
"""
Setup script for Gaussian Knowledge Graph Plugin
Installs cclib and other required dependencies
"""

import subprocess
import sys
import os
import importlib.util

def check_python_version():
    """Check if Python version is supported"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def install_package(package):
    """Install a Python package using pip"""
    try:
        print(f"📦 Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def check_package_import(package_name, import_name=None):
    """Check if a package can be imported"""
    if import_name is None:
        import_name = package_name
    
    try:
        spec = importlib.util.find_spec(import_name)
        if spec is not None:
            module = importlib.import_module(import_name)
            version = getattr(module, '__version__', 'unknown')
            print(f"✅ {package_name} version: {version}")
            return True
        else:
            print(f"❌ {package_name} not found")
            return False
    except ImportError:
        print(f"❌ Could not import {package_name}")
        return False

def install_requirements():
    """Install all required packages"""
    requirements_file = os.path.join(os.path.dirname(__file__), "py", "requirements.txt")
    
    if os.path.exists(requirements_file):
        try:
            print(f"📋 Installing from {requirements_file}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_file])
            print("✅ All requirements installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install from requirements.txt")
            return False
    else:
        print("⚠️  requirements.txt not found, installing core dependencies manually")
        
        # Core dependencies
        packages = [
            "cclib>=1.8.1",
            "numpy>=1.21.0"
        ]
        
        success = True
        for package in packages:
            if not install_package(package):
                success = False
        
        return success

def verify_cclib_installation():
    """Verify cclib installation and test with a sample file"""
    print("\n🔬 Verifying cclib installation...")
    
    try:
        import cclib
        from cclib.io import ccread
        from cclib.parser.utils import PeriodicTable
        
        print(f"✅ cclib version: {cclib.__version__}")
        print("✅ cclib.io module: OK")
        print("✅ PeriodicTable: OK")
        
        # Test basic functionality
        pt = PeriodicTable()
        carbon = pt.element[6]
        if carbon == "C":
            print("✅ PeriodicTable functionality: OK")
        else:
            print("❌ PeriodicTable functionality: Failed")
            return False
        
        return True
        
    except ImportError as e:
        print(f"❌ cclib import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ cclib verification failed: {e}")
        return False

def test_parser_script():
    """Test the cclib parser script"""
    print("\n🧪 Testing cclib parser script...")
    
    parser_script = os.path.join(os.path.dirname(__file__), "py", "parse_gaussian_cclib.py")
    
    if not os.path.exists(parser_script):
        print(f"❌ Parser script not found: {parser_script}")
        return False
    
    try:
        # Test script help
        result = subprocess.run([sys.executable, parser_script], 
                              capture_output=True, text=True, timeout=10)
        
        if "cclib" in result.stdout or "Usage:" in result.stdout:
            print("✅ Parser script: OK")
            return True
        else:
            print(f"❌ Parser script test failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Parser script test timed out")
        return False
    except Exception as e:
        print(f"❌ Parser script test error: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up Gaussian Knowledge Graph Plugin with cclib")
    print("="*60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    print("\n📦 Installing Python dependencies...")
    if not install_requirements():
        print("\n❌ Failed to install some dependencies")
        print("Please try manual installation:")
        print("pip install cclib numpy")
        sys.exit(1)
    
    # Verify installations
    print("\n🔍 Verifying installations...")
    
    packages_to_check = [
        ("cclib", "cclib"),
        ("numpy", "numpy"),
        ("scipy", "scipy"),
        ("matplotlib", "matplotlib"),
        ("pandas", "pandas"),
        ("networkx", "networkx")
    ]
    
    core_success = True
    optional_count = 0
    
    for package_name, import_name in packages_to_check:
        if check_package_import(package_name, import_name):
            if package_name in ["cclib", "numpy"]:
                # Core packages
                pass
            else:
                # Optional packages
                optional_count += 1
        else:
            if package_name in ["cclib", "numpy"]:
                core_success = False
                print(f"❌ Core package {package_name} is required!")
    
    if not core_success:
        print("\n❌ Setup failed - core dependencies missing")
        sys.exit(1)
    
    # Verify cclib specifically
    if not verify_cclib_installation():
        print("\n❌ cclib verification failed")
        sys.exit(1)
    
    # Test parser script
    if not test_parser_script():
        print("\n⚠️  Parser script test failed, but cclib is installed")
    
    # Summary
    print("\n" + "="*60)
    print("✅ Setup completed successfully!")
    print(f"🔬 cclib is ready for comprehensive molecular data parsing")
    print(f"📊 Optional packages available: {optional_count}/4")
    
    if optional_count < 4:
        print("\n💡 For enhanced functionality, consider installing optional packages:")
        print("pip install scipy matplotlib pandas networkx")
    
    print("\n🎯 Next steps:")
    print("1. Place Gaussian .log/.out files in example_logs/ directory")
    print("2. Initialize the plugin in your ElizaOS application")
    print("3. Start querying your molecular data!")
    
    print("\nFor more information, see the README.md file.")

if __name__ == "__main__":
    main() 