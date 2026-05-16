# AI Agent Projesi

A personal AI assistant and market intelligence toolkit.

## What's inside

| Component | Description |
|-----------|-------------|
| `main.py` | Python personal assistant — multi-turn conversation loop powered by Claude (Anthropic SDK) |
| `src/agent.js` | Node.js agent — scrapes Turkish tech company websites and generates an HTML dashboard |
| `src/a16_scan.js` | Price scanner — tracks Samsung Galaxy A16 prices across major Turkish e-commerce sites |
| `tools/firecrawl.js` | Web scraping via Firecrawl |
| `tools/apify.js` | Web scraping via Apify |

## Setup

### Python assistant

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Add your Anthropic API key to `.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

Run:

```sh
python main.py
```

### Node.js agents

```sh
npm install
```

Add your API keys to `.env`:

```
FIRECRAWL_API_KEY=your-key-here
APIFY_API_TOKEN=your-token-here
```

Run the company dashboard scraper:

```sh
npm start
```

Run the A16 price scanner:

```sh
node src/a16_scan.js
```

## Requirements

- Python 3.10+
- Node.js 18+
