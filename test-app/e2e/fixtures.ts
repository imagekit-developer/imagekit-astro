import { test as base, expect } from '@playwright/test';
import { createRequire } from 'module';
export { expect };

function getInstalledAstroVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const astroPkg = require('astro/package.json');
    console.log(`Detected installed Astro version: ${astroPkg.version}`);
    return astroPkg.version;
  } catch {
    return 'latest';
  }
}

export type AstroVersionFixture = {
  astroVersion: string;
};

export const test = base.extend<AstroVersionFixture>({
  // eslint-disable-next-line no-empty-pattern
    astroVersion: async ({}, use) => {
    const version = getInstalledAstroVersion();
    await use(version);
  },
});

export function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map((v) => parseInt(v, 10) || 0);
  if (parts.length === 1) {
    return [parts[0], 0, 0];
  }
  if (parts.length === 2) {
    return [parts[0], parts[1], 0];
  }
  return parts.slice(0, 3) as [number, number, number];
}

export function isVersionBelow(
  currentVersion: string,
  minVersion: string
): boolean {
  const current = parseVersion(currentVersion);
  const min = parseVersion(minVersion);

  for (let i = 0; i < 3; i++) {
    if (current[i] < min[i]) return true;
    if (current[i] > min[i]) return false;
  }
  return false;
}

export function skipIfAstroVersionBelow(
  currentVersion: string,
  minVersion: string
): boolean {
  return isVersionBelow(currentVersion, minVersion);
}
