require("dotenv").config();

const { scrapeToMarkdown } = require("../tools/firecrawl");
const { runActor } = require("../tools/apify");

module.exports = { scrapeToMarkdown, runActor };
