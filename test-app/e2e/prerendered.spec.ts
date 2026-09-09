import { test, expect } from "@playwright/test";

/**
 * Covers the build-time routing fix: on a prerendered route inside an
 * `output: 'server'` app, Astro runs images through its static image
 * pipeline. ImageKit srcs must stay on the CDN with their transformations,
 * while local imports must still be emitted by sharp into `/_astro/`.
 *
 * Before the fix, `astro build` itself failed for this page (ENOENT for the
 * bare ImageKit path), so the web server never started.
 */
test("Prerendered page routes ImageKit srcs to the CDN and local assets to sharp", async ({ page }) => {
  await page.goto("/prerendered");

  const ikCases = [
    "prerender-ik-bare-path",
    "prerender-ik-absolute-url",
    "prerender-ik-additional-endpoint",
  ];
  for (const id of ikCases) {
    const img = page.locator(`[data-test-id="${id}"] img`);
    const src = await img.getAttribute("src");
    const srcset = await img.getAttribute("srcset");
    expect(src, id).toMatch(/^https:\/\/ik\.(imagekit\.io|imgkit\.net)\//);
    expect(src, id).toContain("tr=");
    expect(src, id).not.toContain("/_astro/");
    expect(src, id).not.toContain("/_image");
    if (srcset) {
      expect(srcset, id).not.toContain("/_astro/");
      expect(srcset, id).not.toContain("/_image");
    }
  }

  const absolute = page.locator('[data-test-id="prerender-ik-absolute-url"] img');
  expect(await absolute.getAttribute("src")).toContain("h-100,w-100");

  const sources = page.locator('[data-test-id="prerender-ik-picture"] source');
  expect(await sources.count()).toBe(2);
  for (const format of ["avif", "webp"]) {
    const srcset = await page
      .locator(`[data-test-id="prerender-ik-picture"] source[type="image/${format}"]`)
      .getAttribute("srcset");
    expect(srcset).toContain("https://ik.imagekit.io/");
    expect(srcset).toContain(`f-${format}`);
  }

  const local = page.locator('[data-test-id="prerender-sharp-local-import"] img');
  expect(await local.getAttribute("src")).toMatch(/^\/_astro\/hero\..*\.webp$/);
  expect(await local.getAttribute("src")).not.toContain("ik.imagekit.io");
});

test("Prerendered page renders correctly", async ({ page }) => {
  await page.goto("/prerendered");

  const container = page.locator(".container");
  const outputHtml = await container.evaluate((el) => el.outerHTML);

  expect(outputHtml).toMatchSnapshot();
});
