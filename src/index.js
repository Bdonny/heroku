const express = require("express");
const { chromium } = require("playwright-chromium");
const { firefox } = require("playwright-firefox");
const { run } = require("./run");

const app = express();
app.use(express.static("./public"));
const port = process.env.PORT || 3000;

app.get("/browser/:name", async (req, res) => {
  const browserName = req.params["name"] || "chromium";
  if (!["chromium", "firefox"].includes(browserName)) {
    return res.status(500).send(`invalid browser name (${browserName})!`);
  }
  const topic = req.query.url || "YouTube";
  console.log(req.query);
  if (topic === "YouTube") {
    console.log("No topic");
    return;
  }
  const waitUntil = req.query.waitUntil || "load";
  const width = req.query.width ? parseInt(req.query.width, 10) : 1920;
  const height = req.query.height ? parseInt(req.query.height, 10) : 1080;
  console.log(
    `Incoming request for browser '${browserName}' and topic '${topic}'`
  );

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

    let results = await run(page, topic);
    results = JSON.stringify(results);
    const data = await page.screenshot({
      type: "png",
    });
    await browser.close();

    res.contentType("image/png");
    res.set("Content-Disposition", "inline;");
    res.send(data);
  } catch (err) {
    res.status(500).send(`Something went wrong: ${err}`);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
