#!/usr/bin/env python3
"""Diagnostic script for GSWIN ERP frontend and backend"""
import requests
import sys

def test_backend():
    """Test backend endpoints"""
    print("=" * 50)
    print("BACKEND TEST")
    print("=" * 50)

    base_url = "http://localhost:8000"

    # Test root endpoint
    try:
        resp = requests.get(f"{base_url}/", timeout=5)
        print(f"[OK] Backend root: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"[FAIL] Backend root failed: {e}")
        return False

    # Test login
    try:
        resp = requests.post(
            f"{base_url}/auth/login",
            data={"username": "norbert", "password": "Spengler123"},
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"[OK] Login successful: user={data['user']['username']}")
            token = data["access_token"]
        else:
            print(f"[FAIL] Login failed: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        return False

    # Test kunden endpoint
    try:
        resp = requests.get(
            f"{base_url}/kunden/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"[OK] Kunden API: {len(data.get('items', []))} customers found")
        else:
            print(f"[FAIL] Kunden API failed: {resp.status_code}")
    except Exception as e:
        print(f"[FAIL] Kunden API failed: {e}")

    return True

def test_frontend():
    """Test frontend dev server"""
    print("\n" + "=" * 50)
    print("FRONTEND TEST")
    print("=" * 50)

    # Check multiple ports
    ports = [5173, 5174, 5175, 5176]
    found = False

    for port in ports:
        try:
            resp = requests.get(f"http://localhost:{port}/", timeout=3)
            if resp.status_code in [200, 404]:  # Both mean server is running
                print(f"[OK] Frontend responding on port {port} (status: {resp.status_code})")
                found = True
                return True
        except requests.exceptions.ConnectionError:
            continue
        except Exception as e:
            print(f"[?] Port {port}: {e}")

    if not found:
        print("[FAIL] Frontend dev server not running on any known port")
        print("  (Checked ports: 5173, 5174, 5175, 5176)")
        return False

    return True

def main():
    print("GSWIN ERP Stack Diagnostic\n")

    backend_ok = test_backend()
    frontend_ok = test_frontend()

    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Backend:  {'[OK] Running' if backend_ok else '[FAIL] Not running'}")
    print(f"Frontend: {'[OK] Running' if frontend_ok else '[FAIL] Not running'}")

    if backend_ok and frontend_ok:
        print("\n[OK] Full stack is operational!")
        print("  Frontend: http://localhost:5174 (or next available port)")
        print("  Backend:  http://localhost:8000")
        print("  Login:    norbert / Spengler123")
        return 0
    else:
        print("\n[FAIL] Issues detected - see above for details")
        return 1

if __name__ == "__main__":
    sys.exit(main())