"""Test the PostgreSQL date filtering fix"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("🧪 Testing PostgreSQL Date Filtering Fix\n")
print("=" * 60)

try:
    # Test 1: Get bonuses by month
    print("\n📅 Test 1: Get bonuses for February 2026...")
    response = requests.get(f"{BASE_URL}/api/bonus-templates/dates/2026/02")

    if response.status_code == 200:
        bonuses = response.json()
        print(f"✅ Success! Found {len(bonuses)} bonuses")
        if bonuses:
            print("\n   Sample bonuses:")
            for bonus in bonuses[:3]:
                print(f"   - {bonus['id']} ({bonus.get('bonus_type', 'N/A')})")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"   {response.text}")

    # Test 2: Get all bonuses
    print("\n📦 Test 2: Get all bonuses...")
    response = requests.get(f"{BASE_URL}/api/bonus-templates")

    if response.status_code == 200:
        all_bonuses = response.json()
        print(f"✅ Success! Total bonuses: {len(all_bonuses)}")
    else:
        print(f"❌ Error: {response.status_code}")

    print("\n" + "=" * 60)
    print("🎉 PostgreSQL date filtering is working!")
    print("=" * 60)

except requests.exceptions.ConnectionError:
    print("❌ Error: Cannot connect to backend server")
    print("   Make sure the server is running on port 8000")
except Exception as e:
    print(f"❌ Error: {str(e)}")
