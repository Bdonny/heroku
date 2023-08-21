const { scrape } = require("./actions");

const adsTags = [
  "video",
  " sharing",
  " camera phone",
  " video phone",
  " free",
  " upload",
];

/*
 * Retrieves tags from a youtube video using the href.
 */
const getTags = async (url, page, repeat) => {
  console.log("%cgetting tags...", "color: green");
  let tags = null;
  let tagsArray = new Array();
  if (!url.includes("www.youtube.com")) url = "https://www.youtube.com" + url;
  console.log(url);
  await page.goto(url);
  await page.waitForSelector("#player");
  await page.click("#player");
  tags = await page.$$eval("head", (elements) => {
    return elements[0]?.querySelector('meta[name="keywords"]')?.content;
  });
  if (tags) tagsArray = tags.toLowerCase().split(",");
  if (tagsArray.length > 10) tagsArray = tagsArray.slice(0, 11);
  if (tagsArray.every((i) => adsTags.includes(i))) return null; //HANDLE ADS
  while (repeat > 0) {
    tagsArray = [...tagsArray, ...tagsArray];
    --repeat;
  }

  return tagsArray;
};

/*
 * Changes the string to an int.
 */
const sanitizeViews = (views) => {
  console.log("Sanitizing views...");
  if (!views) return null;
  views = views.replace(" views", "");
  views = views.replace(".", "");
  views = views.replace("K", "000");
  views = views.replace("M", "000000");
  views = views.replace("B", "000000000");
  return parseInt(views.trim());
};

/*
 * Sanitizes strings in array.
 */
const sanitizeTagArray = (tags) => {
  console.log("Sanitizing tags...");
  var regex = /[^a-zA-Z0-9\s]/g;
  if (!tags) return null; //ERR
  let res = new Array();
  for (let tag of tags) {
    tag = tag.toLowerCase();
    tag = tag.trim();
    tag = tag.replace(regex, "");
    res.push(tag);
  }
  return res;
};

/*
 * sorts and counts elements in an array.
 */
const sortAndCountStrings = (arr) => {
  const sortedArr = arr.slice().sort(); // Copy and sort the array
  const result = [];

  let currentElement = null;
  let currentCount = 0;

  for (const element of sortedArr) {
    if (element.trim() !== currentElement) {
      if (currentElement !== null) {
        result.push({ element: currentElement, count: currentCount });
      }
      currentElement = element;
      currentCount = 1;
    } else {
      currentCount++;
    }
  }

  if (currentElement) {
    result.push({ element: currentElement, count: currentCount });
  }

  return result.sort((a, b) => b.count - a.count);
};

module.exports = {
  sanitizeTagArray,
  sanitizeViews,
  getTags,
  sortAndCountStrings,
};
