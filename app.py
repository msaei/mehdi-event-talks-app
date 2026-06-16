import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# Simple in-memory cache
cache = {
    "data": None,
    "last_updated": 0
}
CACHE_TTL = 300  # 5 minutes

def parse_release_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return []

    try:
        # Avoid Namespace errors by using standard parsing
        root = ET.fromstring(response.content)
    except Exception as e:
        print(f"Error parsing XML: {e}")
        return []

    # Namespace map for Atom
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = root.findall('atom:entry', ns)
    parsed_updates = []
    
    for entry in entries:
        title = entry.find('atom:title', ns)
        date_str = title.text if title is not None else "Unknown Date"
        
        updated = entry.find('atom:updated', ns)
        updated_str = updated.text if updated is not None else ""
        
        link = entry.find("atom:link[@rel='alternate']", ns)
        link_str = link.attrib.get('href') if link is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text if id_elem is not None else str(hash(date_str))
        
        content_elem = entry.find('atom:content', ns)
        if content_elem is None or not content_elem.text:
            continue
            
        content_html = content_elem.text
        
        # Parse the HTML content to break down updates by <h3> headers
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_type = "Update"
        current_elements = []
        item_counter = 0
        
        def save_current_update():
            nonlocal item_counter
            if current_elements:
                html_content = "".join(str(el) for el in current_elements).strip()
                if html_content:
                    sub_id = f"{entry_id}_{item_counter}"
                    # Normalize type
                    normal_type = current_type.capitalize()
                    
                    parsed_updates.append({
                        "id": sub_id,
                        "date": date_str,
                        "updated": updated_str,
                        "link": link_str,
                        "type": normal_type,
                        "content": html_content
                    })
                    item_counter += 1

        for child in soup.children:
            if child.name in ['h3', 'h4']:
                save_current_update()
                current_type = child.get_text().strip()
                current_elements = []
            else:
                if str(child).strip():
                    current_elements.append(child)
                    
        save_current_update()
        
    return parsed_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or not cache["data"] or (now - cache["last_updated"] > CACHE_TTL):
        updates = parse_release_feed()
        if updates:
            cache["data"] = updates
            cache["last_updated"] = now
        elif not cache["data"]:
            cache["data"] = []
            
    return jsonify({
        "success": True,
        "last_updated": cache["last_updated"],
        "updates": cache["data"]
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
