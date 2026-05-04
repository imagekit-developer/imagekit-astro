import { test, expect } from "@playwright/test";

test("Markdown page renders correctly", async ({ page }) => {
  await page.goto("/md");

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(2000);

  const container = page.locator(".container");
  const outputHtml = await container.evaluate((el) => el.outerHTML);

  expect(outputHtml).toMatchSnapshot();
});
