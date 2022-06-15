const markdownIt = require("markdown-it");
var markdownItp = require("markdown-it")();
const tm = require("markdown-it-texmath");
const { DateTime } = require("luxon");
const pageAssetsPlugin = require('eleventy-plugin-page-assets');

const pathPrefix = '/steffen.plunder'

module.exports = (config) => {
  config.addPassthroughCopy({ 'public': './' })
  config.addPassthroughCopy({'src/assets': 'assets'})
  config.setBrowserSyncConfig({
    files: ['dist/**/*'],
    open: true,
  })
  let markdownLibrary = markdownIt({
    html: true,     breaks: false,     linkify: false,   })
    .use(require("markdown-it-emoji"))
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-prism"))
    .use(require("markdown-it-container"), "warning")
    .use(require("markdown-it-attrs"))
    .use(require("markdown-it-anchor").default)
    .use(require("markdown-it-table-of-contents"), {
      "includeLevel": [2,3,4], "containerClass": ""})
    .use(tm,  {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
    });
  //markdownLibrary.normalizeLink = function(url) { return pathPrefix.concat(url); };
  config.setLibrary("md", markdownLibrary);
  config.addPairedShortcode("markdown", (content, inline = null) => {
    return inline
      ? markdownLibrary.renderInline(content)
      : markdownLibrary.render(content);
  });
  
  // add collections 
  config.addCollection('projects',
    collection => {
      return collection.getFilteredByGlob('./src/research/projects/**/*.md').sort(
        (a, b) => ( a.data.order > b.data.order ? 1 : -1 )
      )
    });


    config.addCollection('blog',
    collection => {
      return collection.getFilteredByGlob('./src/blog/posts/**/*.md')
    });
  // date config
  config.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  config.addFilter("readableDateMonths", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "LLL yyyy"
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
    pathPrefix: pathPrefix.concat('/'),
    markdownTemplateEngine: 'njk',
  }
}
