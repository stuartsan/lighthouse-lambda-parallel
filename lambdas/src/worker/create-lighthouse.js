const chromium = require("chrome-aws-lambda");
const lighthouse = require("lighthouse");
const args = chromium.args.concat(["--remote-debugging-port=9222"]);

module.exports = async function createLighthouse(url, options = {}, config) {
  console.log(`Boostrapping lighthouse for url: ${url}`);
  options.output = options.output || "html";
  const log = options.logLevel ? require("lighthouse-logger") : null;
  if (log) {
    log.setLevel(options.logLevel);
  }
  return chromium.puppeteer
    .launch({
      args: args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    })
    .then(browser => {
      options.port = browser.port;
      return {
        browser,
        log,
        start() {
          return lighthouse(url, options, config);
        }
      };
    });
};
