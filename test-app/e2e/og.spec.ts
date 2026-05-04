import { test, expect } from "@playwright/test";

test("OG page emits expected meta tags", async ({ page }) => {
  await page.goto("/og");

  const IK_URL = "https://ik.imagekit.io/demo/default-image.jpg?tr=w-1200,h-630";
  const ALT = "Default ImageKit demo image";

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Hello from @imagekit/astro",
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    IK_URL,
  );
  await expect(
    page.locator('meta[property="og:image:secure_url"]'),
  ).toHaveAttribute("content", IK_URL);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
    "content",
    "630",
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    ALT,
  );

  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Hello from @imagekit/astro",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    IK_URL,
  );
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
    "content",
    ALT,
  );

  // Helper-built escape hatch URL — full match
  await expect(
    page.locator('meta[property="og:image:secondary"]'),
  ).toHaveAttribute(
    "content",
    "https://ik.imagekit.io/demo/default-image.jpg?tr=bl-5:w-1200,h-630",
  );
});
