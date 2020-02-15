import chromium from "chrome-aws-lambda"
import lighthouse from "lighthouse";

const args = chromium.args.concat(["--remote-debugging-port=9222"]);

export const createLighthouse = async (url: string, options: any = {}, config?: any) => {
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
            // options.port = browser.port;
            return {
                browser,
                log,
                start() {
                    console.log("attempting to start lighthouse function");
                    return lighthouse(url, options, config);
                }
            };
        });
};
