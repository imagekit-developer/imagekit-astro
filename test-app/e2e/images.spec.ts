import { test, expect } from "@playwright/test";

test("Image page renders correctly", async ({ page }) => {
  await page.goto("/images");

  // Scroll to the bottom to trigger lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(2000);

  const container = page.locator(".container");
  const outputHtml = await container.evaluate((el) => el.outerHTML);

  expect(outputHtml).toMatchSnapshot();
});
