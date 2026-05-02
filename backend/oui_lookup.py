# A lightweight dictionary of common MAC Address prefixes (OUIs)
COMMON_OUIS = {
    # Apple
    "F4:0F:24": "Apple, Inc.",
    "B8:C1:11": "Apple, Inc.",
    "00:1E:52": "Apple, Inc.",
    
    # Samsung
    "00:16:32": "Samsung Electronics",
    "90:18:7C": "Samsung Electronics",
    
    # Intel (Very common in Windows laptops)
    "00:02:B3": "Intel Corporate",
    "80:86:F2": "Intel Corporate",
    "00:15:00": "Intel Corporate",
    
    # Dell
    "00:14:22": "Dell Inc.",
    "A4:BA:DB": "Dell Inc.",
    
    # HP
    "00:0F:20": "Hewlett Packard",
    "B4:B6:76": "Hewlett Packard",
    
    # TP-Link (Added from your local network scan!)
    "28:87:BA": "TP-Link Systems Inc.",
    "C0:C9:E3": "TP-Link Systems Inc.",
    "E8:48:B8": "TP-Link Systems Inc.",
    
    # Network Gear (Routers/Switches/IoT)
    "00:14:BF": "Cisco Systems",
    "00:0C:43": "Ralink Technology", # Common in cheap Wi-Fi adapters
    "00:1A:11": "Google, Inc.", # Chromecasts/Google Home
    "B8:27:EB": "Raspberry Pi Foundation",
    "DC:A6:32": "Raspberry Pi Trading Ltd"
}

def get_vendor(mac_address):
    if not mac_address or mac_address == "Unknown":
        return "Generic/Unknown Device"
        
    # Get the first 8 characters (XX:XX:XX)
    prefix = mac_address[:8].upper()
    
    # Look it up in our dictionary
    return COMMON_OUIS.get(prefix, "Generic/Unknown Device")