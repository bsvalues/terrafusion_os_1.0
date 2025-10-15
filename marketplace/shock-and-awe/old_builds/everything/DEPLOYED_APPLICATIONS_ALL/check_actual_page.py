import requests
import re

try:
    response = requests.get('http://localhost:5000', timeout=5)
    content = response.text
    
    print("=== ACTUAL PAGE CONTENT ANALYSIS ===")
    print()
    
    # Check title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    if title_match:
        print(f"Page Title: {title_match.group(1)}")
    
    # Check for TerraFusion branding
    if 'TerraFusion' in content:
        print("✅ TerraFusion found in content")
        terrafusion_matches = re.findall(r'[^<>]*TerraFusion[^<>]*', content)
        for match in terrafusion_matches[:5]:  # Show first 5 matches
            print(f"  - {match.strip()}")
    else:
        print("❌ TerraFusion NOT found in content")
    
    # Check for Intelligence That Counties Envy
    if 'Intelligence That Counties Envy' in content:
        print("✅ 'Intelligence That Counties Envy' tagline found")
    else:
        print("❌ 'Intelligence That Counties Envy' tagline NOT found")
    
    # Check for brand colors
    if '#0891b2' in content:
        print("✅ Cosmic Blue (#0891b2) found")
    else:
        print("❌ Cosmic Blue (#0891b2) NOT found")
        
    if '#00d2ff' in content:
        print("✅ Quantum Teal (#00d2ff) found")
    else:
        print("❌ Quantum Teal (#00d2ff) NOT found")
    
    # Check navbar content
    navbar_match = re.search(r'<nav.*?</nav>', content, re.DOTALL | re.IGNORECASE)
    if navbar_match:
        print("\n=== NAVBAR CONTENT ===")
        navbar_text = re.sub(r'<[^>]+>', ' ', navbar_match.group(0))
        navbar_text = ' '.join(navbar_text.split())
        print(f"Navbar text: {navbar_text}")
    
    # Check h1 tags
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    if h1_matches:
        print("\n=== H1 HEADINGS ===")
        for h1 in h1_matches:
            h1_text = re.sub(r'<[^>]+>', ' ', h1)
            h1_text = ' '.join(h1_text.split())
            print(f"H1: {h1_text}")
    
    print(f"\n=== CONTENT LENGTH ===")
    print(f"Total content length: {len(content)} characters")
    
    # Show first 500 characters to see what's actually there
    print(f"\n=== FIRST 500 CHARACTERS ===")
    print(content[:500])
    
except requests.exceptions.RequestException as e:
    print(f"❌ Failed to connect to localhost:5000: {e}")
except Exception as e:
    print(f"❌ Error: {e}") 