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

// Analyze strings

function calculateJaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return (intersection.size / union.size) * 100;
}

function compareStrings(string1, string2, string3, query) {
  console.log("Analysing titles...");
  const words1 = new Set(string1.split(" "));
  const words2 = new Set(string2.split(" "));
  const words3 = new Set(string3.split(" "));
  const string = new Set(query.split(" "));

  const similarity12 = calculateJaccardSimilarity(words1, string);
  const similarity13 = calculateJaccardSimilarity(words2, string);
  const similarity23 = calculateJaccardSimilarity(words3, string);

  const displayString1 = highlightDifferences(string1, string, similarity12);
  const displayString2 = highlightDifferences(string2, string, similarity13);
  const displayString3 = highlightDifferences(string3, string, similarity23);

  let html = `
      <div>Analysis 1: ${displayString1}</div>
      <div>Analysis 2: ${displayString2}</div>
      <div>Analysis 3: ${displayString3}</div>
  `;
  return html;
}

function highlightDifferences(str1, str2, similarity) {
  let result = "";
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] === str2[i]) {
      result += `<span class="similarity">${str1[i]}</span>`;
    } else {
      result += `<span class="difference">${str1[i]}</span>`;
    }
  }
  return `${result} (Similarity: ${similarity.toFixed(2)}%)`;
}

module.exports = {
  sanitizeTagArray,
  sanitizeViews,
  getTags,
  sortAndCountStrings,
  compareStrings,
};
