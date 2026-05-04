import { AstroError } from "astro/errors";
import type { Loader } from "astro/loaders";
import { z } from "astro/zod";

const IMAGEKIT_DEFAULT_LIMIT = 1000;
const IMAGEKIT_API_BASE = "https://api.imagekit.io";

const REQUIRED_CREDENTIALS = [
  "IMAGEKIT_PRIVATE_KEY",
] as const;

export interface ImageKitAssetsLoaderOptions {
  /**
   * Folder path to limit the search within a specific folder.
   * For example, `/sales-banner/` will only search in folder sales-banner.
   */
  path?: string;

  /**
   * Filter results by file type.
   * - `all` — include all file types
   * - `image` — include only image files
   * - `non-image` — include only non-image files (e.g., JS, CSS, video)
   * @default "all"
   */
  fileType?: "all" | "image" | "non-image";

  /**
   * Maximum number of assets to load.
   * @default 1000
   */
  limit?: number;

  /**
   * Sort the results.
   * @default "ASC_CREATED"
   */
  sort?:
    | "ASC_NAME"
    | "DESC_NAME"
    | "ASC_CREATED"
    | "DESC_CREATED"
    | "ASC_UPDATED"
    | "DESC_UPDATED"
    | "ASC_HEIGHT"
    | "DESC_HEIGHT"
    | "ASC_WIDTH"
    | "DESC_WIDTH"
    | "ASC_SIZE"
    | "DESC_SIZE";

  /**
   * Query string in a Lucene-like query language.
   * e.g. `createdAt > "7d"` or `name: "banner"`
   * When present, `fileType` and `path` filter behavior may change.
   */
  searchQuery?: string;

  /**
   * Filter results by asset type.
   * - `file` — returns only files
   * - `folder` — returns only folders
   * - `all` — returns both files and folders
   * @default "file"
   */
  type?: "file" | "file-version" | "folder" | "all";
}

export interface ImageKitAsset {
  fileId: string;
  type: string;
  name: string;
  filePath: string;
  tags: string[] | null;
  AITags:
    | Array<{ name: string; confidence: number; source: string }>
    | null;
  versionInfo: { id: string; name: string };
  isPrivateFile: boolean;
  customCoordinates: string | null;
  url: string;
  thumbnail: string;
  fileType: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  hasAlpha: boolean;
  customMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Zod schema for ImageKit asset entries in the content collection.
 */
export const imagekitAssetSchema = z.object({
  fileId: z.string(),
  type: z.string(),
  name: z.string(),
  filePath: z.string(),
  tags: z.array(z.string()).nullable().optional(),
  AITags: z
    .array(
      z.object({
        name: z.string(),
        confidence: z.number(),
        source: z.string(),
      })
    )
    .nullable()
    .optional(),
  versionInfo: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  isPrivateFile: z.boolean().optional(),
  customCoordinates: z.string().nullable().optional(),
  url: z.string(),
  thumbnail: z.string().optional(),
  fileType: z.string(),
  mime: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.number().optional(),
  hasAlpha: z.boolean().optional(),
  customMetadata: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

interface ListAssetsParams {
  path?: string;
  fileType?: string;
  limit?: number;
  skip?: number;
  sort?: string;
  searchQuery?: string;
  type?: string;
}

async function listAssets(
  params: ListAssetsParams,
  privateKey: string
): Promise<ImageKitAsset[]> {
  const url = new URL("/v1/files", IMAGEKIT_API_BASE);

  if (params.path) url.searchParams.set("path", params.path);
  if (params.fileType) url.searchParams.set("fileType", params.fileType);
  if (params.limit !== undefined)
    url.searchParams.set("limit", String(params.limit));
  if (params.skip !== undefined)
    url.searchParams.set("skip", String(params.skip));
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.searchQuery)
    url.searchParams.set("searchQuery", params.searchQuery);
  if (params.type) url.searchParams.set("type", params.type);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(privateKey + ":").toString("base64")}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ImageKit API error (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}

/**
 * An Astro content loader that fetches assets from your ImageKit media library.
 *
 * @example
 * ```ts
 * // src/content.config.ts
 * import { defineCollection } from 'astro:content';
 * import { ikAssetsLoader } from '@imagekit/astro/loaders';
 *
 * export const collections = {
 *   assets: defineCollection({
 *     loader: ikAssetsLoader({
 *       limit: 10,
 *       path: '/samples/',
 *       fileType: 'image',
 *     })
 *   }),
 * };
 * ```
 */
export function ikAssetsLoader(
  options?: ImageKitAssetsLoaderOptions
): Loader {
  return {
    name: "imagekit-assets-loader",
    load: async ({ store, logger, generateDigest }) => {
      REQUIRED_CREDENTIALS.forEach((CREDENTIAL) => {
        if (typeof import.meta.env[CREDENTIAL] === "undefined") {
          throw new AstroError(
            `Missing ${CREDENTIAL}. Please set it as an environment variable inside of your .env file.`
          );
        }
      });

      const privateKey = import.meta.env.IMAGEKIT_PRIVATE_KEY;

      logger.info("Loading ImageKit Assets");

      const {
        path,
        fileType = "all",
        limit = IMAGEKIT_DEFAULT_LIMIT,
        sort = "ASC_CREATED",
        searchQuery,
        type = "file",
      } = options || {};

      let assets: ImageKitAsset[] = [];
      let totalAssetsLoaded = 0;

      // ImageKit API supports max 1000 per request.
      // Paginate using `skip` to load more.
      const perPage = Math.min(limit, 1000);

      while (totalAssetsLoaded < limit) {
        const currentLimit = Math.min(perPage, limit - totalAssetsLoaded);
        let data: ImageKitAsset[];

        try {
          data = await listAssets(
            {
              path,
              fileType,
              limit: currentLimit,
              skip: totalAssetsLoaded,
              sort,
              searchQuery,
              type,
            },
            privateKey
          );
        } catch (error) {
          logger.error(`${error}`);
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        assets = [...assets, ...data];
        totalAssetsLoaded += data.length;

        // If we received fewer results than requested, there are no more assets
        if (data.length < currentLimit) {
          break;
        }
      }

      logger.info(`Loaded ${assets.length} assets from ImageKit`);

      for (const asset of assets) {
        const data: Record<string, unknown> = { ...asset };
        store.set({
          id: asset.fileId,
          data,
          digest: generateDigest(data),
        });
      }
    },
    schema: imagekitAssetSchema,
  };
}
