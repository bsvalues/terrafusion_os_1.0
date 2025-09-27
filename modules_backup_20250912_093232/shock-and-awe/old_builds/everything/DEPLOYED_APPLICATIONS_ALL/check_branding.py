import requests
import re

print("=== TERRAFUSION BRANDING VERIFICATION ===")
print()

try:
    r = requests.get('http://127.0.0.1:\${{TF_API_PORT:-5000}}')
    
    # Check page title
    title_match = re.search(r'<title>(.*?)</title>', r.text)
    print(f"Page Title: {title_match.group(1) if title_match else 'NOT FOUND'}")
    
    # Check navbar brand
    navbar_match = re.search(r'navbar-brand.*?>(.*?)</a>', r.text, re.DOTALL)
    if navbar_match:
        navbar_text = re.sub(r'<[^>]+>', '', navbar_match.group(1)).strip()
        print(f"Navbar Brand: {navbar_text}")
    else:
        print("Navbar Brand: NOT FOUND")
    
    # Check for TerraFusion tagline
    if "Intelligence That Counties Envy" in r.text:
        print("Tagline: ✅ 'Intelligence That Counties Envy' FOUND")
    else:
        print("Tagline: ❌ 'Intelligence That Counties Envy' NOT FOUND")
    
    # Check CSS colors
    cosmic_match = re.search(r'--tf-cosmic-blue:\s*#([0-9a-fA-F]{6})', r.text)
    quantum_match = re.search(r'--tf-quantum-teal:\s*#([0-9a-fA-F]{6})', r.text)
    
    print(f"Cosmic Blue: {'#' + cosmic_match.group(1) if cosmic_match else '❌ NOT FOUND'}")
    print(f"Quantum Teal: {'#' + quantum_match.group(1) if quantum_match else '❌ NOT FOUND'}")
    
    # Check for Tesla/Jobs/Musk/Brady reference
    if "Tesla Precision" in r.text and "Jobs Elegance" in r.text:
        print("Excellence Tagline: ✅ 'Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence' FOUND")
    else:
        print("Excellence Tagline: ❌ NOT FOUND")
    
    # Check for enterprise elements
    if "Enterprise" in r.text:
        print("Enterprise Branding: ✅ FOUND")
    else:
        print("Enterprise Branding: ❌ NOT FOUND")
        
    print()
    print("=== SUMMARY ===")
    if cosmic_match and quantum_match and "Intelligence That Counties Envy" in r.text:
        print("🎯 VERDICT: This IS authentic TerraFusion branding!")
    else:
        print("❌ VERDICT: This is NOT proper TerraFusion branding!")
        
except Exception as e:
    print(f"❌ Error checking application: {e}") 