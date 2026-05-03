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
  * The ImageKit URL endpoint.
  * If omitted, PUBLIC_IMAGEKIT_URL_ENDPOINT is checked first,
  * then IMAGEKIT_URL_ENDPOINT.
   */
  urlEndpoint?: string;

  /**
   * Position of the transformation string in the URL.
   */
  transformationPosition?: 'path' | 'query';

  /**
   * Additional remote hostnames to allow in Astro image config.
   */
  domains?: string[];

  /**
   * Additional Astro remote patterns to allow.
   */
  remotePatterns?: Partial<RemotePattern>[];
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
          import.meta.env?.PUBLIC_IMAGEKIT_URL_ENDPOINT ??
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

        const mergedDomains = uniqStrings([
          ...normalizeDomainList(imageConfigRecord.domains),
          ...normalizeDomainList(options.domains),
          DEFAULT_IMAGEKIT_HOSTNAME,
          ...(endpoint?.hostname ? [endpoint.hostname] : []),
        ]);

        const mergedRemotePatterns = uniqPatterns([
          ...normalizePatternList(imageConfigRecord.remotePatterns),
          ...normalizePatternList(options.remotePatterns),
          ...getDefaultRemotePatterns(endpoint),
        ]);

        const nextServiceConfig: Record<string, unknown> = {
          ...(typeof existingServiceConfig === 'object' ? existingServiceConfig : {}),
        };

        if (resolvedUrlEndpoint) {
          nextServiceConfig.urlEndpoint = resolvedUrlEndpoint;
        }

        if (resolvedTransformationPosition) {
          nextServiceConfig.transformationPosition = resolvedTransformationPosition;
        }

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
            'No ImageKit urlEndpoint found. Set PUBLIC_IMAGEKIT_URL_ENDPOINT or IMAGEKIT_URL_ENDPOINT, or pass urlEndpoint to imagekit().',
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
