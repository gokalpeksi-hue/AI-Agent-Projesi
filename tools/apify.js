const { ApifyClient } = require("apify-client");

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function runActor(actorId, input) {
  const run = await apify.actor(actorId).call(input, { timeout: 120 });

  if (!run || !run.defaultDatasetId) {
    throw new Error("Actor çalışması tamamlanamadı veya dataset ID alınamadı");
  }

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();
  return items;
}

module.exports = { runActor };
