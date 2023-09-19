const express = require("express");
const { chromium } = require("playwright-chromium");
const { firefox } = require("playwright-firefox");
const { run } = require("./run");
const { sendDynoMetrics } = require("./helpers/api");

const app = express();
app.use(express.static("./public"));
const port = process.env.PORT || 3000;

// Define the list of allowed domains
const allowedDomains = ["https://dyno-ai.com", "dyno-ai.com"];

// Enable CORS only for the specified domains
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedDomains.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    // This is a pre-flight request; respond successfully
    res.sendStatus(200);
  } else {
    // Continue processing the request
    next();
  }
});

app.get("/browser/:name", async (req, res) => {
  const browserName = req.params["name"] || "chromium";
  if (!["chromium", "firefox"].includes(browserName)) {
    return res.status(500).send(`invalid browser name (${browserName})!`);
  }
  const topic = req.query.topic || null;
  const recent = req.query.recent || false;
  const user = req.query.user || null;
  console.log(req.query);
  if (!topic) {
    console.log("No topic");
    return;
  }
  const waitUntil = req.query.waitUntil || "load";
  const width = req.query.width ? parseInt(req.query.width, 10) : 1920;
  const height = req.query.height ? parseInt(req.query.height, 10) : 1080;
  console.log(
    `Incoming request for browser '${browserName}' and topic '${topic}' recent '${recent}'`
  );
  let metrics = null;
  try {
    /** @type {import('playwright-chromium').Browser} */
    const browser = await { chromium, firefox }[browserName].launch({
      chromiumSandbox: false,
    });
    const page = await browser.newPage({
      viewport: {
        width,
        height,
      },
    });

    let results = await run(page, topic, recent);
    await browser.close();
    results = JSON.stringify(results);
    res.json(results);
    metrics = {
      user,
      search: topic,
      results: results?.tags,
      success: true,
    };
  } catch (err) {
    res.status(500).send(`Something went wrong: ${err}`);
    metrics = { user, search: topic, results: err, success: false };
  } finally {
    sendDynoMetrics(metrics);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
