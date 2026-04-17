import type { APIRoute } from 'astro';
import { getUploadAuthParams } from '@imagekit/astro/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  const authParams = getUploadAuthParams({
    privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
  });

  return new Response(JSON.stringify(authParams), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
