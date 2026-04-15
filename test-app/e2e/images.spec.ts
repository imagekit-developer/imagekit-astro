import { test, expect } from "@playwright/test";

test("Image page renders correctly", async ({ page }) => {
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

test("Image renders with correct class", async ({ page }) => {
  await page.goto("/images");

  // Check that Image has the correct base class
  const images = page.locator('img.astro-imagekit-image');
  const count = await images.count();
  expect(count).toBeGreaterThan(0);
});

test("Image with custom class has both classes", async ({ page }) => {
  await page.goto("/images");

  // Check for image with custom class
  const imageWithCustomClass = page.locator('img.astro-imagekit-image.custom-class');
  await expect(imageWithCustomClass).toBeVisible();
});

test("Image generates srcset for responsive images", async ({ page }) => {
  await page.goto("/images");

  // Get the first responsive image (example 1)
  const responsiveImage = page.locator('.example').nth(0).locator('img');
  const srcset = await responsiveImage.getAttribute('srcset');

  // Responsive images should have srcset
  expect(srcset).toBeTruthy();
  expect(srcset).toContain('ik.imagekit.io');
});

test("Image non-responsive does not generate srcset", async ({ page }) => {
  await page.goto("/images");

  // Example 7 is non-responsive
  const nonResponsiveImage = page.locator('.example').nth(6).locator('img');
  const srcset = await nonResponsiveImage.getAttribute('srcset');

  // Non-responsive images should not have srcset
  expect(srcset).toBeFalsy();
});

test("Image with transformations generates correct URL", async ({ page }) => {
  await page.goto("/images");

  // Example 3 has transformation
  const transformedImage = page.locator('.example').nth(2).locator('img');
  const src = await transformedImage.getAttribute('src');

  // src should contain transformation parameters
  expect(src).toContain('ik.imagekit.io');
  expect(src).toContain('tr=');
});

test("Image with queryParameters includes them in URL", async ({ page }) => {
  await page.goto("/images");

  // Example 4 has queryParameters
  const imageWithQuery = page.locator('.example').nth(3).locator('img');
  const src = await imageWithQuery.getAttribute('src');

  // src should contain query parameter
  expect(src).toContain('version=v1');
});

test("Image with loading=eager has correct attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 9 has loading="eager"
  const eagerImage = page.locator('.example').nth(8).locator('img');
  const loading = await eagerImage.getAttribute('loading');

  expect(loading).toBe('eager');
});

test("Image with data attributes preserves them", async ({ page }) => {
  await page.goto("/images");

  // Example 14 has data attributes
  const imageWithData = page.locator('.example').nth(13).locator('img');
  const testId = await imageWithData.getAttribute('data-testid');
  const customAttr = await imageWithData.getAttribute('data-custom');

  expect(testId).toBe('test-image');
  expect(customAttr).toBe('value');
});

test("Image with transformationPosition=path uses path transformation", async ({ page }) => {
  await page.goto("/images");

  // Example 11 has transformationPosition="path" with transformations
  const pathImage = page.locator('.example').nth(10).locator('img');
  const src = await pathImage.getAttribute('src');

  // Path transformations should have tr: in the path, not ?tr=
  expect(src).toContain('/tr:');
});

// ============================================
// ASTRO IMAGE COMPONENT PROPS TESTS
// ============================================

test("Image with decoding=sync has correct attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 19 has decoding="sync"
  const syncDecodingImage = page.locator('.example').nth(18).locator('img');
  const decoding = await syncDecodingImage.getAttribute('decoding');

  expect(decoding).toBe('sync');
});

test("Image with fetchpriority=high has correct attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 20 has fetchpriority="high"
  const highPriorityImage = page.locator('.example').nth(19).locator('img');
  const fetchpriority = await highPriorityImage.getAttribute('fetchpriority');

  expect(fetchpriority).toBe('high');
});

test("Image with densities generates density-based srcset", async ({ page }) => {
  await page.goto("/images");

  // Example 21 has densities=[1.5, 2]
  const densitiesImage = page.locator('.example').nth(20).locator('img');
  const srcset = await densitiesImage.getAttribute('srcset');

  // Should contain density descriptors (1.5x, 2x)
  expect(srcset).toBeTruthy();
  if (srcset) {
    expect(srcset).toMatch(/\d+(\.\d+)?x/);
  }
});

test("Image with widths generates width-based srcset", async ({ page }) => {
  await page.goto("/images");

  // Example 22 has widths=[240, 540, 720]
  const widthsImage = page.locator('.example').nth(21).locator('img');
  const srcset = await widthsImage.getAttribute('srcset');
  const sizes = await widthsImage.getAttribute('sizes');

  // Should contain width descriptors (240w, 540w, 720w)
  expect(srcset).toBeTruthy();
  expect(sizes).toBeTruthy();
  if (srcset) {
    expect(srcset).toMatch(/\d+w/);
  }
});

test("Image with layout=constrained has correct data attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 23 has layout="constrained"
  const constrainedImage = page.locator('.example').nth(22).locator('img');
  const dataAstroImage = await constrainedImage.getAttribute('data-astro-image');

  expect(dataAstroImage).toBe('constrained');
});

test("Image with layout=full-width has correct data attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 24 has layout="full-width"
  const fullWidthImage = page.locator('.example').nth(23).locator('img');
  const dataAstroImage = await fullWidthImage.getAttribute('data-astro-image');

  expect(dataAstroImage).toBe('full-width');
});

test("Image with layout=fixed has correct data attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 25 has layout="fixed"
  const fixedImage = page.locator('.example').nth(24).locator('img');
  const dataAstroImage = await fixedImage.getAttribute('data-astro-image');

  expect(dataAstroImage).toBe('fixed');
});

test("Image with fit=contain has correct style", async ({ page }) => {
  await page.goto("/images");

  // Example 26 has fit="contain"
  const containFitImage = page.locator('.example').nth(25).locator('img');
  const style = await containFitImage.getAttribute('style');

  // Should have --fit CSS variable set to contain
  expect(style).toContain('--fit');
  expect(style).toContain('contain');
});

test("Image with position prop has correct style", async ({ page }) => {
  await page.goto("/images");

  // Example 27 has position="top left"
  const positionImage = page.locator('.example').nth(26).locator('img');
  const style = await positionImage.getAttribute('style');

  // Should have --pos CSS variable
  expect(style).toContain('--pos');
  expect(style).toContain('top left');
});

test("Image with priority has eager loading attributes", async ({ page }) => {
  await page.goto("/images");

  // Example 28 has priority flag
  const priorityImage = page.locator('.example').nth(27).locator('img');
  const loading = await priorityImage.getAttribute('loading');
  const decoding = await priorityImage.getAttribute('decoding');
  const fetchpriority = await priorityImage.getAttribute('fetchpriority');

  // priority should set loading="eager", decoding="sync", fetchpriority="high"
  expect(loading).toBe('eager');
  expect(decoding).toBe('sync');
  expect(fetchpriority).toBe('high');
});

test("Image with inline style preserves style attribute", async ({ page }) => {
  await page.goto("/images");

  // Example 29 has inline style
  const styledImage = page.locator('.example').nth(28).locator('img');
  const style = await styledImage.getAttribute('style');

  expect(style).toContain('border');
  expect(style).toContain('border-radius');
});

test("Image with id attribute preserves it", async ({ page }) => {
  await page.goto("/images");

  // Example 30 has id attribute
  const imageWithId = page.locator('#my-image-id');
  await expect(imageWithId).toBeVisible();
});

test("Image with title attribute preserves it", async ({ page }) => {
  await page.goto("/images");

  // Example 31 has title attribute
  const imageWithTitle = page.locator('.example').nth(30).locator('img');
  const title = await imageWithTitle.getAttribute('title');

  expect(title).toBe('This is the image title tooltip');
});

test("Image with crossorigin attribute preserves it", async ({ page }) => {
  await page.goto("/images");

  // Example 32 has crossorigin="anonymous"
  const imageWithCrossorigin = page.locator('.example').nth(31).locator('img');
  const crossorigin = await imageWithCrossorigin.getAttribute('crossorigin');

  expect(crossorigin).toBe('anonymous');
});

test("Image with referrerpolicy attribute preserves it", async ({ page }) => {
  await page.goto("/images");

  // Example 33 has referrerpolicy="no-referrer"
  const imageWithReferrer = page.locator('.example').nth(32).locator('img');
  const referrerpolicy = await imageWithReferrer.getAttribute('referrerpolicy');

  expect(referrerpolicy).toBe('no-referrer');
});


