const {
  sanitizeTagArray,
  sanitizeViews,
  getTags,
  sortAndCountStrings,
} = require("./helpers/navigation");

const subscribers = "#owner-sub-count";
const run = async (page, topic) => {
  try {
    console.log("Initializing the bot...");
    let tags = new Array();
    let query = topic || "elden ring";
    console.log("Searching for " + query);
    query = query.replace(" ", "+");
    await page.goto(
      "https://www.youtube.com/results?search_query=" + query.trim()
    );
    await page.waitForSelector("#contents > ytd-video-renderer");
    await page.keyboard.down("End");

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
    let data = { videos: results, tags: tags };

    //get thumbnails
    let images = new Array();
    let titles = new Array();
    for (let video of results) {
      if (video.thumbnail) images.push(video.thumbnail);
      if (titles.length < 5) titles.push(video.videoName);
      if (images.length > 3 && titles.length >= 5) break;
    }
    data.thumbnails = images;
    data.titles = titles;

    console.log(data);
    console.log("Entries found: " + results.length);
    return data;
  } catch (error) {
    console.log("%c!ERROR! " + error, "color: red");
  }
};

module.exports = { run };
