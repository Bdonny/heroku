const {
  sanitizeTagArray,
  sanitizeViews,
  getTags,
  sortAndCountStrings,
  compareStrings,
} = require("./helpers/navigation");

const subscribers = "#owner-sub-count";
let search = null;
const recentFilter = "&sp=EgIIBA%253D%253D";

const run = async (page, topic, recent) => {
  let query2 = "";
  try {
    console.log("Initializing the bot...");
    let tags = new Array();
    let query = topic || "elden ring";
    let average = null;
    let sum = 0;
    console.log("Searching for " + query);
    search = query;
    query = query.replace(" ", "+");
    if (recent) query2 = recentFilter;
    await page.goto(
      "https://www.youtube.com/results?search_query=" + query.trim() + query2
    );
    await page.waitForSelector("#contents > ytd-video-renderer");
    await page.keyboard.down("End");
    //await page.waitForTimeout(500);

    let results = new Array();
    results = await page.$$eval(
      "#contents > ytd-video-renderer",
      (elements) => {
        let list = new Array();
        const nameSelector = "#video-title"; //
        const verifiedSelector = "[aria-label='Verified']";
        const newSelector = "#badges > div > span";
        const viewSelector = "#metadata-line > span";
        const thumbnail = "#thumbnail > yt-image > img";

        elements.map((element) => {
          const nameElem = element?.querySelector(nameSelector);
          const verifiedElem = element?.querySelector(verifiedSelector);
          const viewsElem = element?.querySelector(viewSelector);
          const imgElem = element.querySelector(thumbnail);

          let isVerified = false;
          let isNew = false;
          if (verifiedElem?.innerHTML) isVerified = true;
          const newElem = element?.querySelector(newSelector);

          if (newElem?.innerHTML === "New") isNew = true;
          const entry = {
            videoName: nameElem?.title,
            views: viewsElem?.innerHTML ?? null,
            isVerified,
            isNew,
            thumbnail: imgElem?.src,
            href: nameElem?.getAttribute("href")?.split("&pp=")[0],
          };
          list.push(entry);
        });

        return list;
      }
    );
    //eval end
    results.forEach((video) => {
      video.views = sanitizeViews(video?.views);
      sum += video.views;
    });

    for (let video of results) {
      let videoTags = new Array();
      let repeat = 0;
      if (!video.isVerified) ++repeat;
      if (video.views > 100000) ++repeat;
      if (video.isNew) ++repeat;
      video.score = repeat;
      videoTags = await getTags(video.href, page, repeat);
      if (videoTags) tags = [...tags, ...videoTags];
    }
    results = results.sort((a, b) => b.score - a.score);
    tags = sanitizeTagArray(tags);
    tags = sortAndCountStrings(tags);
    let data = { search, videos: results, tags: tags };

    //get thumbnails
    let images = new Array();
    let titles = new Array();
    for (let video of results) {
      titles.push(video.videoName);
      if (titles.length >= 5) break;
    }
    for (let video of results) {
      if (video.thumbnail) images.push(video.thumbnail);
      if (images.length >= 6) break;
    }
    data.thumbnails = images;
    data.titles = titles;
    let titlesHtml = compareStrings(titles[0], titles[1], titles[2], search);
    data.html = titlesHtml;
    average = sum / results.length;
    data.avarage = average;

    console.log(data);
    console.log("Entries found: " + results.length);
    return data;
  } catch (error) {
    console.log("%c!ERROR! " + error, "color: red");
  }
};

module.exports = { run };
