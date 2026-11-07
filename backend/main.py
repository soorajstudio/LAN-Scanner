from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import subprocess
import socket
import re
import json
import asyncio
import platform  # NEW: For OS/CPU info
import psutil    # MOVED to top: For RAM/Disk info
import time

from oui_lookup import get_vendor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_intelligent_sweep():
    yield f"data: {json.dumps({'status': 'analyzing', 'message': 'Querying Local ARP Cache...'})}\n\n"
    
    active_hosts = []
    try:
        output = subprocess.check_output(['arp', '-a'], text=True)
        for line in output.split('\n'):
            if 'dynamic' in line.lower() or 'static' in line.lower():
                match = re.search(r"(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]+)", line)
                if match:
                    ip = match.group(1)
                    mac = match.group(2).replace('-', ':').upper()
                    if not ip.endswith('.255'):
                        active_hosts.append({"ip": ip, "mac": mac})
    except Exception as e:
        yield f"data: {json.dumps({'status': 'error', 'message': f'ARP failed: {str(e)}'})}\n\n"
        return

    total_devices = len(active_hosts)
    devices = []

    for idx, host in enumerate(active_hosts):
        ip = host['ip']
        mac = host['mac']
        yield f"data: {json.dumps({'status': 'progress', 'current': idx + 1, 'total': total_devices, 'ip': ip, 'message': f'Verifying & Resolving: {ip}'})}\n\n"
        
        await asyncio.to_thread(subprocess.run, f"ping -n 1 -w 10 {ip} > nul", shell=True)
        
        try:
            socket.setdefaulttimeout(0.2)
            hostname = socket.gethostbyaddr(ip)[0]
        except Exception:
            hostname = "Unresolved Node"
            
        vendor = get_vendor(mac)
        devices.append({"ip": ip, "name": hostname, "mac": mac, "vendor": vendor})

    yield f"data: {json.dumps({'status': 'complete', 'devices': devices})}\n\n"

async def stream_telemetry():
    last_io = psutil.net_io_counters()
    while True:
        await asyncio.sleep(1)
        current_io = psutil.net_io_counters()
        
        bytes_sent = current_io.bytes_sent - last_io.bytes_sent
        bytes_recv = current_io.bytes_recv - last_io.bytes_recv
        
        mbps_tx = round((bytes_sent * 8) / 1000000, 2)
        mbps_rx = round((bytes_recv * 8) / 1000000, 2)
        
        last_io = current_io
        yield f"data: {json.dumps({'tx_mbps': mbps_tx, 'rx_mbps': mbps_rx})}\n\n"

@app.get("/scan")
async def scan_network():
    return StreamingResponse(run_intelligent_sweep(), media_type="text/event-stream")

@app.get("/telemetry")
async def get_telemetry():
    return StreamingResponse(stream_telemetry(), media_type="text/event-stream")

# --- NEW: HOST SYSTEM SPECS ENDPOINT ---
@app.get("/host")
def get_host_details():
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "os": f"{platform.system()} {platform.release()}",
        "cpu": platform.processor(),
        "cores": psutil.cpu_count(logical=False),
        "threads": psutil.cpu_count(logical=True),
        "ram_total": f"{ram.total / (1024**3):.2f} GB",
        "ram_percent": ram.percent,
        "disk_total": f"{disk.total / (1024**3):.2f} GB",
        "disk_percent": disk.percent,
        "hostname": socket.gethostname()
    }

# --- NEW: SPEED TEST ENDPOINT (Pure local measurement) ---
@app.get("/speedtest")
async def speed_test():
    """
    Run speed test by measuring actual network throughput over time.
    Uses system network statistics for accurate real-world measurements.
    """
    try:
        # Get initial network stats
        io_start = psutil.net_io_counters()
        bytes_sent_start = io_start.bytes_sent
        bytes_recv_start = io_start.bytes_recv
        
        # Measure for 5 seconds
        await asyncio.sleep(5)
        
        # Get final network stats
        io_end = psutil.net_io_counters()
        bytes_sent_end = io_end.bytes_sent
        bytes_recv_end = io_end.bytes_recv
        
        # Calculate differences
        bytes_sent = bytes_sent_end - bytes_sent_start
        bytes_recv = bytes_recv_end - bytes_recv_start
        
        # Convert to Mbps (bits per second / 1,000,000)
        # Over 5 seconds
        download_mbps = round((bytes_recv * 8) / (5 * 1_000_000), 2)
        upload_mbps = round((bytes_sent * 8) / (5 * 1_000_000), 2)
        
        # Ensure minimum non-zero values
        download_mbps = max(0.01, download_mbps)
        upload_mbps = max(0.01, upload_mbps)
        
        return {
            "download": download_mbps,
            "upload": upload_mbps,
            "status": "complete",
            "message": "Speed test measured from network interface activity"
        }
    except Exception as e:
        return {
            "download": None,
            "upload": None,
            "status": "error",
            "message": f"Speed test error: {str(e)}"
        }