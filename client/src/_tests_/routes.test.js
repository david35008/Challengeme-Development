const puppeteer = require('puppeteer');

let page;
let browser;
jest.setTimeout(30000);
describe("All the routes are working together", () => {
	beforeAll(async () => {
		//open a chromium browser
		browser = await puppeteer.launch({ args: [
			`--window-size=1280,768`,
		  ]
		  });
		//open a new page within that browser
		page = await browser.newPage();
		const screenSize = {
			width: 1280,
			height: 768,
		  };
		await page.setViewport(screenSize);
		await page.goto("http://localhost:3000/statistics", { waitUntil: "networkidle0" });
	});
	afterAll(async () => {
		//close the chromium after each test
		await browser.close();
	});

	test("Insight component test", async () => {
		// click on the insight icon in the navbar and render to the insight page
		await page.waitForSelector("#Insights");
		await page.click("#Insights");
		await page.waitForSelector("#SubmissionPerDayChart");
		let SubmissionPerDayChart =await page.evaluate(
			() => document.querySelector("#SubmissionPerDayChart").innerText
		);
		console.log('asdasdsada', SubmissionPerDayChart);
		expect(SubmissionPerDayChart).toBe('submissions per day')	
  })
});

