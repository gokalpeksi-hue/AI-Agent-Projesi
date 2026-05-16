# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

A personal AI assistant agent. Handles tasks, answers questions, and automates workflows on behalf of the user.

## Tech Stack

**Python Agent**
- **Language:** Python
- **LLM SDK:** Anthropic SDK (`anthropic`)

**JavaScript Agent**
- **Language:** Node.js
- **Web Scraping:** Firecrawl (`@mendable/firecrawl-js`), Apify (`apify-client`)
- **Config:** `dotenv`

## Project Structure

```
├── main.py              # Entry point — runs the personal assistant conversation loop
├── requirements.txt     # Python dependencies
├── .env                 # API keys (not committed)
├── src/
│   ├── agent.js         # JavaScript agent — scrapes Turkish tech companies
│   └── index.js         # Re-exports JS tools
├── tools/
│   ├── firecrawl.js     # Web scraping via Firecrawl
│   └── apify.js         # Web scraping via Apify
└── output/
    └── dashboard.html   # Generated HTML dashboard from JS agent
```

## Development

### Setup

```sh
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Set your API key before running:

```sh
$env:ANTHROPIC_API_KEY = "your-key-here"
```

### Run

```sh
python main.py
```

### Test

```sh
pytest
```

## Conventions

- Follow PEP 8 for code style
- Use type hints on all function signatures
- `snake_case` for variables and functions, `PascalCase` for classes
- Keep functions small and single-purpose
- Use `f-strings` for string formatting
- Store secrets in environment variables, never in code
