const markdownIt = require("markdown-it");
var markdownItp = require("markdown-it")();
const tm = require("markdown-it-texmath");
const { DateTime } = require("luxon");
const pageAssetsPlugin = require('eleventy-plugin-page-assets');


module.exports = (config) => {
  config.addPassthroughCopy({ 'public': './' })
  config.setBrowserSyncConfig({
    files: ['dist/**/*'],
    open: true,
  })
  let markdownLibrary = markdownIt({
    html: true,     breaks: true,     linkify: true,   })
    .use(require("markdown-it-emoji"))
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-anchor").default)
    .use(require("markdown-it-table-of-contents"), {"containerClass": ""})
    .use(tm,  {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
    });
  config.setLibrary("md", markdownLibrary);
  
  // add collections 
  config.addCollection('projects',
    collection => {
      return collection.getFilteredByGlob('./src/research/projects/**/*.md')
    });


  // date config
  config.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  config.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("dd-LL-yyyy");
  });

  config.addPlugin(pageAssetsPlugin, {
    mode: "parse",
    postsMatching: "src/**/*.md",
  });

  config.addFilter("sitemapDateTimeString", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    if (!dt.isValid) {
      return "";
    }
    return dt.toISO();
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
    },
    markdownTemplateEngine: 'njk',
  }
}
