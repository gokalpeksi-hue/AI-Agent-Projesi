require("dotenv").config();
const { scrapeToMarkdown, searchWeb } = require("../tools/firecrawl");
const fs = require("fs");
const path = require("path");

const MODELS = [
  "Samsung Galaxy A16 4GB 128GB",
  "Samsung Galaxy A16 5G 4GB 128GB",
];

// Dünkü (15.05.2026) fiyatlar — karşılaştırma için
const YESTERDAY = {
  "Samsung Galaxy A16 4GB 128GB":   { amazon: null, hepsiburada: null, trendyol: null },
  "Samsung Galaxy A16 5G 4GB 128GB": { amazon: "149,90 TL (yanlış eşleşme)", hepsiburada: null, trendyol: null },
};

const SITES = [
  { name: "Amazon TR",    query: (m) => `site:amazon.com.tr "${m}" fiyat TL` },
  { name: "Hepsiburada",  query: (m) => `site:hepsiburada.com "${m}" fiyat TL` },
  { name: "Trendyol",     query: (m) => `site:trendyol.com "${m}" fiyat TL` },
  { name: "MediaMarkt",   query: (m) => `site:mediamarkt.com.tr "${m}" fiyat TL` },
  { name: "Vatan",        query: (m) => `site:vatanbilgisayar.com "${m}" fiyat TL` },
];

function extractPrice(text) {
  // "9.999 TL", "9.999,00 TL", "₺9.999" formatlarını yakala
  const match = text.match(/[\d]{1,3}(?:[.\s]?\d{3})*(?:[,]\d{2})?\s*(?:TL|₺)/i)
             || text.match(/(?:₺|TL\s*)[\d]{1,3}(?:[.\s]?\d{3})*/i);
  return match ? match[0].trim() : null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scanModel(model) {
  const result = { model, prices: {} };
  console.log(`\n▶ ${model}`);

  for (const site of SITES) {
    process.stdout.write(`  ${site.name.padEnd(14)}`);
    try {
      const hits = await searchWeb(site.query(model), 5);
      let found = null;

      for (const hit of hits) {
        const combined = `${hit.title} ${hit.description}`;
        const price = extractPrice(combined);
        if (price) {
          // Fiyat 1.000 TL altındaysa büyük ihtimalle yanlış eşleşme
          const numeric = parseFloat(price.replace(/[^\d,]/g, "").replace(",", "."));
          if (numeric > 1000) {
            found = price;
            break;
          }
        }
      }

      result.prices[site.name] = found;
      console.log(found ? `✅ ${found}` : "— bulunamadı");
    } catch (e) {
      result.prices[site.name] = null;
      console.log(`❌ ${e.message.slice(0, 50)}`);
    }

    await sleep(1200); // rate limit koruması
  }

  return result;
}

function buildChangeSummary(results) {
  const lines = [];
  for (const r of results) {
    const yesterday = YESTERDAY[r.model] || {};
    const changes = [];

    for (const [site, newPrice] of Object.entries(r.prices)) {
      const siteKey = site.toLowerCase().replace(/\s/g, "");
      const oldPrice = yesterday[siteKey === "amazontр" ? "amazon" : siteKey] || null;

      if (newPrice && !oldPrice) {
        changes.push(`${site}: YENİ → ${newPrice}`);
      } else if (!newPrice && oldPrice && !oldPrice.includes("yanlış")) {
        changes.push(`${site}: kayboldu (önceki: ${oldPrice})`);
      } else if (newPrice && oldPrice && newPrice !== oldPrice && !oldPrice.includes("yanlış")) {
        changes.push(`${site}: ${oldPrice} → ${newPrice}`);
      }
    }

    lines.push({ model: r.model, changes });
  }
  return lines;
}

function buildHTML(results, summary) {
  const now = new Date().toLocaleString("tr-TR");
  const tableRows = results.map((r) => {
    const cells = SITES.map((s) => {
      const p = r.prices[s.name];
      return p
        ? `<td class="fiyat">${p}</td>`
        : `<td class="bulunamadi">—</td>`;
    }).join("");
    return `<tr><td class="model">${r.model}</td>${cells}</tr>`;
  }).join("\n");

  const summaryRows = summary.map(({ model, changes }) => {
    if (changes.length === 0) return `<li><b>${model}</b>: değişiklik yok</li>`;
    return `<li><b>${model}</b>:<ul>${changes.map((c) => `<li>${c}</li>`).join("")}</ul></li>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
body{font-family:'Segoe UI',sans-serif;background:#121212;color:#e0e0e0;padding:20px}
h2{color:#00bcd4;border-bottom:2px solid #333;padding-bottom:10px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;background:#1e1e24}
th,td{padding:12px 15px;border:1px solid #333;text-align:left}
th{background:#2c2c38;color:#00bcd4;font-weight:bold;text-transform:uppercase}
tr:nth-child(even){background:#23232d}
tr:hover{background:#2a2a35}
.bulunamadi{color:#ff5252;font-style:italic}
.fiyat{color:#69f0ae;font-weight:bold}
.model{font-weight:bold}
.summary{background:#1a2744;border-radius:8px;padding:16px;margin-top:24px}
.summary h3{color:#ffeb3b;margin-bottom:10px}
.summary ul{padding-left:20px;line-height:1.8}
</style></head>
<body>
<h2>Mega Radar — A16 Fiyat Taraması</h2>
<p style="color:#888">Güncelleme: ${now} | Önceki tarama: 15.05.2026 16:24</p>
<table>
<tr><th>Model</th>${SITES.map((s) => `<th>${s.name}</th>`).join("")}</tr>
${tableRows}
</table>
<div class="summary">
  <h3>Fiyat Değişim Özeti (15.05 → 16.05)</h3>
  <ul>${summaryRows}</ul>
</div>
</body></html>`;
}

async function main() {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error("HATA: FIRECRAWL_API_KEY eksik");
    process.exit(1);
  }

  console.log("=== A16 Fiyat Taraması — 16.05.2026 ===\n");
  const results = [];

  for (const model of MODELS) {
    results.push(await scanModel(model));
  }

  const summary = buildChangeSummary(results);
  const html = buildHTML(results, summary);

  const outPath = path.join(__dirname, "../output/a16_radar_16may.html");
  fs.writeFileSync(outPath, html, "utf-8");

  console.log("\n" + "=".repeat(55));
  console.log("DEĞİŞİM ÖZETİ:");
  for (const { model, changes } of summary) {
    console.log(`\n  ${model}`);
    if (changes.length === 0) {
      console.log("    → Değişiklik yok");
    } else {
      changes.forEach((c) => console.log(`    → ${c}`));
    }
  }
  console.log("\n✅ Rapor: output/a16_radar_16may.html");
}

main().catch((e) => { console.error(e); process.exit(1); });
