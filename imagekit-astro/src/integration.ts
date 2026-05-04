import type { AstroIntegration, RemotePattern } from 'astro';

const IMAGEKIT_SERVICE_ENTRYPOINT = '@imagekit/astro/image-service';
const ASTRO_DEFAULT_SERVICE_ENTRYPOINT = 'astro/assets/services/sharp';
const DEFAULT_IMAGEKIT_HOSTNAME = 'ik.imagekit.io';
const DEFAULT_PATHNAME = '/**';
const VIRTUAL_CONFIG_ID = 'virtual:@imagekit/astro/config';
const RESOLVED_VIRTUAL_CONFIG_ID = '\0' + VIRTUAL_CONFIG_ID;

function imagekitConfigVitePlugin(resolved: {
  urlEndpoint?: string;
  transformationPosition?: 'path' | 'query';
}) {
  return {
    name: '@imagekit/astro:virtual-config',
    resolveId(id: string) {
      if (id === VIRTUAL_CONFIG_ID) {
        return RESOLVED_VIRTUAL_CONFIG_ID;
      }
      return null;
    },
    load(id: string) {
      if (id !== RESOLVED_VIRTUAL_CONFIG_ID) {
        return null;
      }
      const urlEndpoint = JSON.stringify(resolved.urlEndpoint ?? '');
      const transformationPosition = JSON.stringify(
        resolved.transformationPosition ?? 'query',
      );
      return `export const urlEndpoint = ${urlEndpoint};
export const transformationPosition = ${transformationPosition};
export default { urlEndpoint, transformationPosition };
`;
    },
  };
}

export interface ImageKitIntegrationOptions {
  /**
   * The ImageKit URL endpoint. Used as the default when an `<Image>` is given
   * a relative `src` and as an IK-eligible host for absolute URLs.
   * If omitted, `IMAGEKIT_URL_ENDPOINT` is used.
   */
  urlEndpoint?: string;

  /**
   * Additional ImageKit URL endpoints (other accounts or custom domains).
   * Their hosts are auto-added to `image.domains` and recognized as IK-eligible
   * by the image service, so absolute URLs on those hosts get IK transformations
   * applied (without being rewritten to the primary `urlEndpoint`).
   *
   * For non-ImageKit hosts you want Astro to optimize via the default sharp
   * service, add them to `image.domains` / `image.remotePatterns` in your
   * `astro.config.mjs` directly.
   */
  additionalEndpoints?: string[];

  /**
   * Position of the transformation string in the URL.
   */
  transformationPosition?: 'path' | 'query';
}

interface ParsedEndpoint {
  hostname: string;
  protocol?: string;
  port?: string;
}

function normalizeHostname(input: string): string {
  return input.trim().toLowerCase();
}

function parseEndpoint(urlEndpoint: string): ParsedEndpoint | undefined {
  if (!urlEndpoint) {
    return undefined;
  }

  try {
    const parsed = new URL(urlEndpoint);
    return {
      hostname: normalizeHostname(parsed.hostname),
      protocol: parsed.protocol.replace(':', '') || undefined,
      port: parsed.port || undefined,
    };
  } catch {
    return undefined;
  }
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeHostname(value)).filter(Boolean)),
  );
}

function patternKey(pattern: Partial<RemotePattern>): string {
  return [
    pattern.protocol ?? '',
    pattern.hostname ?? '',
    pattern.port ?? '',
    pattern.pathname ?? '',
  ].join('|');
}

function uniqPatterns(patterns: Partial<RemotePattern>[]): Partial<RemotePattern>[] {
  const seen = new Set<string>();
  const result: Partial<RemotePattern>[] = [];

  for (const pattern of patterns) {
    const key = patternKey(pattern);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(pattern);
  }

  return result;
}

function normalizeDomainList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is string => typeof value === 'string');
}

function normalizePatternList(values: unknown): Partial<RemotePattern>[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value): value is Partial<RemotePattern> => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.hostname === 'string' ||
      typeof candidate.pathname === 'string' ||
      typeof candidate.protocol === 'string' ||
      typeof candidate.port === 'string'
    );
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getDefaultRemotePatterns(endpoint?: ParsedEndpoint): Partial<RemotePattern>[] {
  const patterns: Partial<RemotePattern>[] = [
    {
      protocol: 'https',
      hostname: DEFAULT_IMAGEKIT_HOSTNAME,
      pathname: DEFAULT_PATHNAME,
    },
  ];

  if (endpoint?.hostname) {
    patterns.push({
      protocol: endpoint.protocol ?? 'https',
      hostname: endpoint.hostname,
      port: endpoint.port,
      pathname: DEFAULT_PATHNAME,
    });
  }

  return uniqPatterns(patterns);
}

export default function imagekit(
  options: ImageKitIntegrationOptions = {},
): AstroIntegration {
  return {
    name: '@imagekit/astro',
    hooks: {
      'astro:config:setup': ({ config, updateConfig, logger }) => {
        const imageConfig = config.image ?? {};
        const imageConfigRecord = asRecord(imageConfig);
        const existingService = asRecord(imageConfigRecord.service);
        const existingServiceConfig = asRecord(existingService.config);
        const existingEntrypoint =
          typeof existingService.entrypoint === 'string'
            ? existingService.entrypoint
            : undefined;

        const resolvedUrlEndpoint =
          options.urlEndpoint ??
          asString(existingServiceConfig.urlEndpoint) ??
          import.meta.env?.IMAGEKIT_URL_ENDPOINT;

        const resolvedTransformationPosition =
          options.transformationPosition ??
          (existingServiceConfig.transformationPosition === 'path' ||
          existingServiceConfig.transformationPosition === 'query'
            ? existingServiceConfig.transformationPosition
            : undefined);

        const endpoint = resolvedUrlEndpoint
          ? parseEndpoint(resolvedUrlEndpoint)
          : undefined;

        if (resolvedUrlEndpoint && !endpoint) {
          logger.warn(
            `Could not parse urlEndpoint "${resolvedUrlEndpoint}" as a URL. Make sure it includes the protocol (e.g. "https://ik.imagekit.io/your_id"). The endpoint host will not be added to image.domains/remotePatterns.`,
          );
        }

        const additionalEndpoints = (options.additionalEndpoints ?? [])
          .map((url) => {
            const parsed = parseEndpoint(url);
            if (!parsed) {
              logger.warn(
                `Could not parse additionalEndpoints entry "${url}" as a URL. Skipping.`,
              );
            }
            return parsed;
          })
          .filter((e): e is ParsedEndpoint => Boolean(e));

        const ikHosts = uniqStrings([
          DEFAULT_IMAGEKIT_HOSTNAME,
          ...(endpoint?.hostname ? [endpoint.hostname] : []),
          ...additionalEndpoints.map((e) => e.hostname),
        ]);

        const mergedDomains = uniqStrings([
          ...normalizeDomainList(imageConfigRecord.domains),
          ...ikHosts,
        ]);

        const mergedRemotePatterns = uniqPatterns([
          ...normalizePatternList(imageConfigRecord.remotePatterns),
          ...getDefaultRemotePatterns(endpoint),
          ...additionalEndpoints.flatMap((e) => getDefaultRemotePatterns(e)),
        ]);

        // Only carry forward keys we recognize. Any leftover keys from a
        // previous image service config (e.g. sharp's `limitInputPixels`)
        // would not make sense for this service.
        const nextServiceConfig: Record<string, unknown> = {};

        if (resolvedUrlEndpoint) {
          nextServiceConfig.urlEndpoint = resolvedUrlEndpoint;
        }

        if (resolvedTransformationPosition) {
          nextServiceConfig.transformationPosition = resolvedTransformationPosition;
        }

        nextServiceConfig.imagekitHosts = ikHosts;

        if (
          existingEntrypoint &&
          existingEntrypoint !== IMAGEKIT_SERVICE_ENTRYPOINT &&
          existingEntrypoint !== ASTRO_DEFAULT_SERVICE_ENTRYPOINT
        ) {
          logger.warn(
            `Overriding image.service.entrypoint (${existingEntrypoint}) with ${IMAGEKIT_SERVICE_ENTRYPOINT}.`,
          );
        }

        if (!resolvedUrlEndpoint) {
          logger.warn(
            'No ImageKit urlEndpoint found. Set IMAGEKIT_URL_ENDPOINT, or pass urlEndpoint to imagekit().',
          );
        }

        updateConfig({
          image: {
            domains: mergedDomains,
            remotePatterns: mergedRemotePatterns,
            service: {
              entrypoint: IMAGEKIT_SERVICE_ENTRYPOINT,
              config: nextServiceConfig,
            },
          },
          vite: {
            plugins: [
              imagekitConfigVitePlugin({
                urlEndpoint: resolvedUrlEndpoint,
                transformationPosition: resolvedTransformationPosition,
              }),
            ],
          },
        });
      },

      // Augment Astro's <Image>/<Picture>/getImage() prop types with
      // ImageKit-specific props so users get autocomplete and type safety.
      // injectTypes() requires Astro >= 4.4; older versions skip this gracefully.
      // https://docs.astro.build/en/reference/integrations-reference/#injecttypes-option
      'astro:config:done': ({ injectTypes }) => {
        if (typeof injectTypes !== 'function') {
          return;
        }
        injectTypes({
          filename: 'imagekit-image-props.d.ts',
          content: `import type { Transformation } from '@imagekit/javascript';

declare module 'virtual:@imagekit/astro/config' {
  export const urlEndpoint: string;
  export const transformationPosition: 'path' | 'query';
  const config: { urlEndpoint: string; transformationPosition: 'path' | 'query' };
  export default config;
}

declare global {
  namespace Astro {
    interface CustomImageProps {
      /** Override the ImageKit URL endpoint for this image. */
      urlEndpoint?: string;
      /**
       * Array of ImageKit transformations applied after Astro's built-in
       * width/height/fit/position/quality mappings. Later items take precedence.
       * @see https://imagekit.io/docs/image-transformation
       */
      transformation?: Transformation[];
      /** Extra query parameters appended to the generated URL. */
      queryParameters?: Record<string, string | number>;
      /**
       * Position of the transformation string in the URL.
       * - \`'query'\` (default): appended as \`?tr=...\`
       * - \`'path'\`: inserted in the URL path as \`tr:...\`
       */
      transformationPosition?: 'path' | 'query';
    }
  }
}

export {};
`,
        });
      },
    },
  };
}
