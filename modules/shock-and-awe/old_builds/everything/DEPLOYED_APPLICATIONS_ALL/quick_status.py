import requests
import time

def main():
    print("TerraFusion Enterprise Ecosystem Status")
    print("Intelligence That Counties Envy")
    print("=" * 50)
    
    apps = [
        ("TerraFusion Build", 5000),
        ("TerraFlow", 5001),
        ("TerraFusionSync", 5002),
        ("TerraAgent", 5003),
        ("TerraFusionAssessor", 5004),
        ("TerraFusionDashboard", 5005),
        ("TerraMiner", 5006),
        ("BSIncomeValuation", 5007),
        ("TerraFusionPro", 5008),
        ("BCBSGISPRO", 5010)
    ]
    
    healthy = 0
    total = len(apps)
    
    for name, port in apps:
        try:
            response = requests.get(f"http://localhost:{port}/", timeout=2)
            if response.status_code == 200:
                print(f"✅ {name} (Port {port}) - HEALTHY")
                healthy += 1
            else:
                print(f"❌ {name} (Port {port}) - HTTP {response.status_code}")
        except:
            print(f"❌ {name} (Port {port}) - OFFLINE")
    
    print(f"\nStatus: {healthy}/{total} applications running")
    
    if healthy >= 8:
        print("🟢 Ecosystem Status: EXCELLENT")
    elif healthy >= 5:
        print("🟡 Ecosystem Status: GOOD")
    else:
        print("🔴 Ecosystem Status: NEEDS ATTENTION")
    
    print("\nAccess URLs:")
    for name, port in apps:
        print(f"  {name}: http://localhost:{port}")

if __name__ == "__main__":
    main() 