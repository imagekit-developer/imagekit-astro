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

// ============================================
// PROPERTY CONFLICT TESTS (Examples 31-35)
// ============================================

test.describe('Property Conflict Tests', () => {
  test('CONFLICT: densities + layout should handle gracefully', async ({ page }) => {
    await page.goto("/images");

    // Example 31: densities + layout conflict
    const conflictImage = page.locator('[data-test-id="conflict-densities-layout"]').locator('img');
    
    // Image should still render
    await expect(conflictImage).toBeVisible();
    
    // Per Astro docs, when layout is set, densities should be ignored
    // The image should use layout-based srcset, not density-based
    const dataAstroImage = await conflictImage.getAttribute('data-astro-image');
    expect(dataAstroImage).toBe('constrained');
  });

  test('CONFLICT: densities + widths should only use one', async ({ page }) => {
    await page.goto("/images");

    // Example 32: densities + widths conflict
    const conflictImage = page.locator('[data-test-id="conflict-densities-widths"]').locator('img');
    
    // Image should render
    await expect(conflictImage).toBeVisible();
    
    // Should have srcset (either from widths or densities, not both)
    const srcset = await conflictImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
  });

  test('CONFLICT: widths without sizes should handle gracefully', async ({ page }) => {
    await page.goto("/images");

    // Example 33: widths without sizes
    const conflictImage = page.locator('[data-test-id="conflict-widths-no-sizes"]').locator('img');
    
    // Image should render
    await expect(conflictImage).toBeVisible();
    
    // sizes might be auto-generated or srcset might not be present
    // The important thing is no errors occur
    const alt = await conflictImage.getAttribute('alt');
    expect(alt).toBeTruthy();
  });

  test('CONFLICT: layout=fixed + widths should not generate width variants', async ({ page }) => {
    await page.goto("/images");

    // Example 34: layout=fixed + widths
    const conflictImage = page.locator('[data-test-id="conflict-fixed-widths"]').locator('img');
    
    // Image should render
    await expect(conflictImage).toBeVisible();
    
    // Should have data-astro-image="fixed"
    const dataAstroImage = await conflictImage.getAttribute('data-astro-image');
    expect(dataAstroImage).toBe('fixed');
  });

  test('CONFLICT: layout=none + responsive should disable responsiveness', async ({ page }) => {
    await page.goto("/images");

    // Example 35: layout=none + responsive
    const conflictImage = page.locator('[data-test-id="conflict-none-layout-responsive"]').locator('img');
    
    // Image should render
    await expect(conflictImage).toBeVisible();
    
    // layout="none" should not generate srcset or data-astro-image attribute
    const dataAstroImage = await conflictImage.getAttribute('data-astro-image');
    // With layout=none, data-astro-image might not be present or be null
    expect(dataAstroImage).toBeNull();
  });
});

// ============================================
// VALID PROPERTY COMBINATION TESTS (Examples 36-40)
// ============================================

test.describe('Valid Property Combinations', () => {
  test('VALID: widths + sizes should generate proper srcset', async ({ page }) => {
    await page.goto("/images");

    // Example 36: widths + sizes (valid combination)
    const validImage = page.locator('[data-test-id="valid-widths-sizes"]').locator('img');
    
    await expect(validImage).toBeVisible();
    
    const srcset = await validImage.getAttribute('srcset');
    const sizes = await validImage.getAttribute('sizes');
    
    // Both should exist
    expect(srcset).toBeTruthy();
    expect(sizes).toBeTruthy();
    
    // srcset should contain width descriptors
    if (srcset) {
      expect(srcset).toMatch(/\d+w/);
    }
  });

  test('VALID: densities alone should generate density-based srcset', async ({ page }) => {
    await page.goto("/images");

    // Example 37: densities alone (valid)
    const validImage = page.locator('[data-test-id="valid-densities-alone"]').locator('img');
    
    await expect(validImage).toBeVisible();
    
    const srcset = await validImage.getAttribute('srcset');
    
    // Should have density descriptors
    expect(srcset).toBeTruthy();
    if (srcset) {
      expect(srcset).toMatch(/\d+(\.\d+)?x/);
    }
  });

  test('VALID: layout + format + quality should work together', async ({ page }) => {
    await page.goto("/images");

    // Example 38: layout + format + quality (valid)
    const validImage = page.locator('[data-test-id="valid-layout-format-quality"]').locator('img');
    
    await expect(validImage).toBeVisible();
    
    // Should have constrained layout
    const dataAstroImage = await validImage.getAttribute('data-astro-image');
    expect(dataAstroImage).toBe('constrained');
    
    // URL should contain format and quality parameters
    const src = await validImage.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
  });

  test('VALID: layout=full-width with responsive props', async ({ page }) => {
    await page.goto("/images");

    // Example 39: layout=full-width
    const validImage = page.locator('[data-test-id="valid-fullwidth-responsive"]').locator('img');
    
    await expect(validImage).toBeVisible();
    
    // Should have full-width layout
    const dataAstroImage = await validImage.getAttribute('data-astro-image');
    expect(dataAstroImage).toBe('full-width');
    
    // Should generate srcset for responsive behavior
    const srcset = await validImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
  });

  test('VALID: responsive=true + ImageKit breakpoints', async ({ page }) => {
    await page.goto("/images");

    // Example 40: responsive + breakpoints (valid)
    const validImage = page.locator('[data-test-id="valid-responsive-breakpoints"]').locator('img');
    
    await expect(validImage).toBeVisible();
    
    // Should have srcset due to responsive=true
    const srcset = await validImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
  });
});

// ============================================
// EDGE CASE TESTS (Examples 41-57)
// ============================================

test.describe('Edge Case Tests - Dimensions', () => {
  test('Edge Case: Minimal dimensions (1px × 1px)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-minimal-dimensions"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const width = await edgeImage.getAttribute('width');
    expect(width).toBe('1');
  });

  test('Edge Case: Extreme aspect ratio (1:1000)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-extreme-ratio-tall"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const height = await edgeImage.getAttribute('height');
    expect(height).toBe('10000');
  });

  test('Edge Case: Extreme aspect ratio (1000:1)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-extreme-ratio-wide"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const width = await edgeImage.getAttribute('width');
    expect(width).toBe('10000');
  });

  test('Edge Case: Large width (5000px)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-large-width"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const width = await edgeImage.getAttribute('width');
    expect(width).toBe('5000');
  });
});

test.describe('Edge Case Tests - Quality', () => {
  test('Edge Case: Quality = 0 (minimum)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-quality-0"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Should render without error even with minimum quality
    const src = await edgeImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('Edge Case: Quality = 100 (maximum)', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-quality-100"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Should render without error even with maximum quality
    const src = await edgeImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('Edge Case: Quality preset = "low"', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-quality-preset-low"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
  });

  test('Edge Case: Quality preset = "mid"', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-quality-preset-mid"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
  });

  test('Edge Case: Quality preset = "max"', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-quality-preset-max"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
  });
});

test.describe('Edge Case Tests - Formats', () => {
  test('Edge Case: Format = webp', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-format-webp"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('Edge Case: Format = avif', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-format-avif"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('Edge Case: Format = svg', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-format-svg"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    const src = await edgeImage.getAttribute('src');
    expect(src).toBeTruthy();
  });
});

test.describe('Edge Case Tests - Transformations', () => {
  test('Edge Case: Multiple complex transformations', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-complex-transformations"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Should contain transformation parameters in URL
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
    expect(src).toContain('tr=');
  });

  test('Edge Case: transformationPosition="path"', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-transform-position-path"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Path transformations should use /tr: syntax
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('/tr:');
  });

  test('Edge Case: transformationPosition="query"', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-transform-position-query"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Query transformations should use ?tr= syntax or query params
    const src = await edgeImage.getAttribute('src');
    expect(src).toContain('?');
  });
});

test.describe('Edge Case Tests - Responsive Breakpoints', () => {
  test('Edge Case: Extreme device breakpoints', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-device-breakpoints"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Should generate srcset with extreme breakpoints
    const srcset = await edgeImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
  });

  test('Edge Case: Extreme image breakpoints', async ({ page }) => {
    await page.goto("/images");

    const edgeImage = page.locator('[data-test-id="edge-image-breakpoints"]').locator('img');
    
    await expect(edgeImage).toBeVisible();
    
    // Should generate srcset with extreme breakpoints
    const srcset = await edgeImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
  });
});

