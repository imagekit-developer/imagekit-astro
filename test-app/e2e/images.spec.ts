import { test, expect } from "@playwright/test";

test("Images page renders correctly", async ({ page }) => {
  await page.goto("/images");

  // Scroll to the bottom of the page to trigger lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(2000); // Wait for images to load

  // Locate the container element
  const container = page.locator('.container');

  // Grab the entire HTML from the element
  const outputHtml = await container.evaluate(el => el.outerHTML);

  // Compare against a stored snapshot
  expect(outputHtml).toMatchSnapshot();
});
