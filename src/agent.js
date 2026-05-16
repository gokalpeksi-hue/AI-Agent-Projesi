require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { scrapeToMarkdown, searchWeb } = require("../tools/firecrawl");

const COMPANIES = [
  {
    name: "Turkcell",
    website: "https://www.turkcell.com.tr",
    linkedin: "turkcell",
  },
  {
    name: "Türk Telekom",
    website: "https://www.turktelekom.com.tr",
    linkedin: "turk-telekom",
  },
  {
    name: "Vodafone Türkiye",
    website: "https://www.vodafone.com.tr",
    linkedin: "vodafone",
  },
  {
    name: "Vestel",
    website: "https://www.vestel.com.tr",
    linkedin: "vestel",
  },
  {
    name: "Arçelik",
    website: "https://www.arcelik.com.tr",
    linkedin: "arcelik",
  },
  {
    name: "Casper",
    website: "https://www.casper.com.tr",
    linkedin: "casperturkiye",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label, retries = 2, baseDelayMs = 4000) {
  let delay = baseDelayMs;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`  [!] ${label} — deneme ${attempt}/${retries + 1}: ${err.message}`);
      if (attempt <= retries) {
        console.log(`      ${delay / 1000}s bekleniyor...`);
        await sleep(delay);
        delay = Math.round(delay * 1.5);
      }
    }
  }
  return null;
}

async function getLinkedInSummary(companyName, linkedinSlug) {
  const result = await withRetry(
    async () => {
      const hits = await searchWeb(`site:linkedin.com/company/${linkedinSlug} ${companyName}`, 3);
      const hit = hits.find((h) => h.url.includes(`linkedin.com/company/${linkedinSlug}`)) || hits[0];
      if (!hit || !hit.description) throw new Error("Arama sonucu boş");
      return hit.description.slice(0, 300);
    },
    `LinkedIn (${linkedinSlug})`
  );

  return result || "LinkedIn verisi alınamadı";
}

async function analyzeWebsite(url) {
  const result = await withRetry(
    async () => {
      const md = await scrapeToMarkdown(url);
      if (!md || md.trim().length < 10) throw new Error("İçerik çok kısa");
      return md.slice(0, 400).replace(/\n/g, " ");
    },
    `Web (${url})`
  );

  return result || "Web sitesi analiz edilemedi";
}

function buildHTML(rows) {
  const tableRows = rows
    .map(
      (r) => `
    <tr>
      <td>${r.name}</td>
      <td><a href="${r.website}" target="_blank">${r.website}</a></td>
      <td class="summary">${r.webSummary}</td>
      <td class="summary">${r.linkedinSummary}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>İstanbul Telekom &amp; Tüketici Elektroniği Firmaları</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1117;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 2rem;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 600;
      color: #7dd3fc;
      margin-bottom: 0.4rem;
    }
    p.subtitle {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .table-wrapper {
      overflow-x: auto;
      border-radius: 12px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.5);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #1e2130;
    }
    thead tr { background: #1a2744; }
    th {
      padding: 14px 18px;
      text-align: left;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7dd3fc;
      border-bottom: 1px solid #2d3748;
    }
    td {
      padding: 14px 18px;
      font-size: 0.88rem;
      border-bottom: 1px solid #2d3748;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #263052; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .summary { color: #94a3b8; max-width: 360px; line-height: 1.6; }
    .error { color: #f87171; font-style: italic; }
  </style>
</head>
<body>
  <h1>İstanbul Telekom &amp; Tüketici Elektroniği Firmaları</h1>
  <p class="subtitle">Oluşturulma tarihi: ${new Date().toLocaleString("tr-TR")}</p>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Firma</th>
          <th>Web Sitesi</th>
          <th>Web Özeti</th>
          <th>LinkedIn Özeti</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

async function main() {
  if (!process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY.startsWith("fc-buraya")) {
    console.error("HATA: FIRECRAWL_API_KEY .env dosyasında ayarlanmamış!");
    process.exit(1);
  }

  console.log(`Ajan başlatıldı — ${COMPANIES.length} şirket işlenecek\n`);

  const results = [];

  for (let i = 0; i < COMPANIES.length; i++) {
    const company = COMPANIES[i];
    console.log(`[${company.name}] işleniyor...`);

    const [webSummary, linkedinSummary] = await Promise.all([
      analyzeWebsite(company.website),
      getLinkedInSummary(company.name, company.linkedin),
    ]);

    results.push({ ...company, webSummary, linkedinSummary });
    console.log(`  Web: ${webSummary.slice(0, 80)}...`);
    console.log(`  LinkedIn: ${linkedinSummary.slice(0, 80)}...`);

    if (i < COMPANIES.length - 1) {
      console.log("  5s bekleniyor (rate limit koruması)...\n");
      await sleep(5000);
    }
  }

  const html = buildHTML(results);
  const outPath = path.join(__dirname, "../output/dashboard.html");
  fs.writeFileSync(outPath, html, "utf-8");

  console.log(`\nDashboard oluşturuldu: ${outPath}`);
}

main().catch((err) => {
  console.error("Ajan hatası:", err);
  process.exit(1);
});
