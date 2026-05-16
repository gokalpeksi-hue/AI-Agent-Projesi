const { FirecrawlClient } = require("@mendable/firecrawl-js");

const firecrawl = new FirecrawlClient({ apiKey: process.env.FIRECRAWL_API_KEY });

async function scrapeToMarkdown(url) {
  const response = await firecrawl.scrape(url, {
    formats: ["markdown"],
  });

  const rawMarkdown = response?.markdown ?? response?.data?.markdown;
  if (!rawMarkdown || rawMarkdown.trim().length < 5) {
    throw new Error(`Markdown içeriği boş döndü (success=${response?.success})`);
  }

  return cleanMarkdown(rawMarkdown);
}

async function searchWeb(query, limit = 3) {
  const response = await firecrawl.search(query, { limit });
  const items = response?.web ?? response?.data ?? [];
  return items.map((item) => ({
    url: item.url || "",
    title: item.title || "",
    description: item.description || "",
  }));
}

function cleanMarkdown(raw) {
  return raw
    .replace(/\[.*?\]\(mailto:.*?\)/g, "")       // e-posta linklerini kaldır
    .replace(/!\[.*?\]\(.*?\)/g, "")              // görselleri kaldır
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")      // linkleri düz metne çevir
    .replace(/<!--[\s\S]*?-->/g, "")              // HTML yorumlarını kaldır
    .replace(/\n{3,}/g, "\n\n")                   // fazla boş satırları azalt
    .trim();
}

module.exports = { scrapeToMarkdown, searchWeb };
