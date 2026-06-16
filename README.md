# BigQuery Release Radar 🛰️

BigQuery Release Radar is a premium, real-time web application built with **Python Flask** and **Vanilla HTML/CSS/JavaScript**. It fetches, structures, and parses Google Cloud BigQuery release notes from the official Atom feed, allowing users to search, filter, and compose/share tweets about updates instantly.

---

## 🌟 Key Features

* **Granular Release Splitting**: Instead of showing grouped daily release notes, the application splits entry feeds by headers (`<h3>Feature</h3>`, `<h3>Issue</h3>`, `<h3>Deprecation</h3>`), allowing you to select and interact with specific sub-updates.
* **Cyberpunk-Inspired GCP Dark Theme**: Built with a sleek dark-mode layout using curated color variables, radial glowing backdrops, and interactive glassmorphic cards.
* **Filterable Stats Dashboard**: Displays count metrics for Features, Issues, and Deprecations. Click any stat card to filter the feed dynamically.
* **Debounced Text Search**: Instantly filters updates by keyword in real time.
* **X/Twitter Intent Composer**:
  * Auto-drafts tweet layouts using the update type, date, description, and link.
  * Dynamically computes character counts matching X's shortener logic (where any URL counts as exactly 23 characters).
  * Interactive hashtag pills to customize the tweet signature.
  * Clipboard copying with clean toast animations.
* **In-Memory Caching**: Caches the parsed XML feed for 5 minutes (300s) to keep page loads fast and prevent Google feed server rate-limiting.

---

## 📂 Project Structure

```text
bq-releases-notes/
├── app.py                  # Flask backend server & XML parser
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── .gitignore              # Git ignored files
├── templates/
│   └── index.html          # Semantic HTML page layout
└── static/
    ├── css/
    │   └── style.css       # Premium responsive styling & glassmorphism
    └── js/
        └── app.js          # Client-side state manager & Tweet intent builder
```

---

## 🚀 Installation & Setup

Ensure you have **Python 3.9+** and **pip** installed.

### 1. Clone & Navigate
Navigate to the project root folder:
```bash
cd bq-releases-notes
```

### 2. Set Up Virtual Environment
Create and activate a virtual environment:
```bash
# Create environment
python3 -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows CMD)
.venv\Scripts\activate.bat
```

### 3. Install Dependencies
Install the required packages:
```bash
pip install -r requirements.txt
```

### 4. Start the Application
Run the Flask server:
```bash
python3 app.py
```
By default, the server will start in debug mode on **`http://127.0.0.1:5000`**.

---

## ⚙️ Architecture Details

### Backend (`app.py`)
* **Feed Retrieval**: Uses `requests` to fetch Google's release note XML feed.
* **Atom Parsing**: Employs Python's built-in `xml.etree.ElementTree` to parse Atom namespaces.
* **Content Extraction**: Employs `BeautifulSoup4` to walk through entry HTML nodes and break them down into discrete update dictionaries by `<h3>` tags.
* **Caching**: Stores parsed JSON results in a simple local dictionary alongside a timestamp.

### Frontend (`app.js` & `style.css`)
* **State Management**: Controls state variables for loading, filtering, search inputs, and the selected card.
* **Twitter Intents**: Utilizes `https://twitter.com/intent/tweet?text=` to dispatch prefilled drafts directly into the user's Twitter/X compose window.
* **Animations**: Pure CSS transitions for card hover states, active tab highlights, spinner rotations, and copy-text toast pop-ups.

---

## 📄 License

This project is licensed under the MIT License.
