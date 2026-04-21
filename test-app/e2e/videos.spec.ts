import { test, expect } from "@playwright/test";

test("Videos page renders correctly", async ({ page }) => {
  await page.goto("/videos");

  // Scroll to the bottom of the page
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(2000); // Wait for videos to load

  // Locate the container element
  const container = page.locator('.container');

  // Grab the entire HTML from the element
  const outputHtml = await container.evaluate(el => el.outerHTML);

  // Compare against a stored snapshot
  expect(outputHtml).toMatchSnapshot();
});

// ============================================
// EDGE CASE TESTS FOR VIDEO COMPONENT
// ============================================

test.describe('Video Edge Case Tests - Dimensions', () => {
  test('Edge Case: Minimal dimensions (1px × 1px)', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-minimal"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    const width = await edgeVideo.getAttribute('width');
    expect(width).toBe('1');
  });

  test('Edge Case: Large dimensions (4000px × 2000px)', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-large"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    const width = await edgeVideo.getAttribute('width');
    expect(width).toBe('4000');
  });

  test('Edge Case: Extreme aspect ratio (1:500)', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-ratio-tall"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    const height = await edgeVideo.getAttribute('height');
    expect(height).toBe('5000');
  });

  test('Edge Case: Extreme aspect ratio (500:1)', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-ratio-wide"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    const width = await edgeVideo.getAttribute('width');
    expect(width).toBe('5000');
  });
});

test.describe('Video Edge Case Tests - Transformations', () => {
  test('Edge Case: Multiple complex transformations', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-complex-transformations"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    // Should contain transformation parameters
    const src = await edgeVideo.getAttribute('src');
    expect(src).toContain('ik.imagekit.io');
    expect(src).toContain('tr=');
  });

  test('Edge Case: transformationPosition="path"', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-transform-path"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    // Path transformations should use /tr: syntax
    const src = await edgeVideo.getAttribute('src');
    expect(src).toContain('/tr:');
  });

  test('Edge Case: transformationPosition="query"', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-transform-query"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    // Query transformations should use query params
    const src = await edgeVideo.getAttribute('src');
    expect(src).toContain('?');
  });
});

test.describe('Video Edge Case Tests - Attributes', () => {
  test('Edge Case: All HTML attributes combined', async ({ page }) => {
    await page.goto("/videos");

    const edgeVideo = page.locator('[data-test-id="video-edge-all-attributes"]').locator('video');
    
    await expect(edgeVideo).toBeVisible();
    
    // Check for all attributes
    const controls = await edgeVideo.getAttribute('controls');
    const autoplay = await edgeVideo.getAttribute('autoplay');
    const loop = await edgeVideo.getAttribute('loop');
    const muted = await edgeVideo.getAttribute('muted');
    const preload = await edgeVideo.getAttribute('preload');
    
    expect(controls).not.toBeNull();
    expect(autoplay).not.toBeNull();
    expect(loop).not.toBeNull();
    expect(muted).not.toBeNull();
    expect(preload).toBe('metadata');
  });
});

