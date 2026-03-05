import socket
import dns.resolver
import httpx
import asyncio

async def diagnose():
    host = "kvntrynsbcwdvyxeuemr.supabase.co"
    print(f"--- Diagnosing connection to {host} ---")
    
    # 1. DNS Resolution
    try:
        ip = socket.gethostbyname(host)
        print(f"[OK] DNS resolved {host} to {ip}")
    except Exception as e:
        print(f"[FAIL] DNS resolution failed: {e}")
        return

    # 2. Socket Connection (Port 443)
    try:
        s = socket.create_connection((host, 443), timeout=5)
        print(f"[OK] Successfully established TCP connection to {host}:443")
        s.close()
    except Exception as e:
        print(f"[FAIL] TCP connection to {host}:443 failed: {e}")
        print("Suggestion: Check your firewall or proxy settings. Port 443 might be blocked for Python.")

    # 3. HTTP Request
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://{host}")
            print(f"[OK] HTTP GET successful. Status: {resp.status_code}")
    except Exception as e:
        print(f"[FAIL] HTTP GET failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(diagnose())
    except Exception as e:
        print(f"Error running diagnostic: {e}")
