import requests

def test_page(url, name):
    try:
        r = requests.get(url)
        print(f"\n{name}:")
        print(f"Status: {r.status_code}")
        print(f"Content Length: {len(r.text)}")
        print("Content Preview:")
        print("-" * 50)
        print(r.text[:500])
        print("-" * 50)
        if "error" in r.text.lower() or "exception" in r.text.lower():
            print("🚨 ERROR DETECTED IN RESPONSE")
    except Exception as e:
        print(f"❌ {name} failed: {e}")

test_page('http://127.0.0.1:5000/portfolio/analytics', 'Portfolio Analytics')
test_page('http://127.0.0.1:5000/ai/valuation', 'AI Valuation')
test_page('http://127.0.0.1:5000/risk/assessment', 'Risk Assessment')
test_page('http://127.0.0.1:5000/market/intelligence', 'Market Intelligence') 