/*
 *Scrapes an element to ghet the value (FIX)
 */
const scrape = async (selector, page) => {
  await page.$eval(selector, (elements) => {
    return elements[0]?.getAttribute("innerHTML");
  });
};

module.exports = { scrape };
