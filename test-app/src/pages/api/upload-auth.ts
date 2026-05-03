import type { APIRoute } from 'astro';
import { getUploadAuthParams } from '@imagekit/astro/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const authParams = getUploadAuthParams({
      privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: import.meta.env.PUBLIC_IMAGEKIT_PUBLIC_KEY,
    });
    return new Response(JSON.stringify(authParams), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating upload auth params:', error);
    if (import.meta.env.CI) {
      const dummyAuthParams = {
        token: 'dummy-token',
        signature: 'dummy-signature',
        expire: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes from now
        publicKey: import.meta.env.PUBLIC_IMAGEKIT_PUBLIC_KEY || 'dummy-public-key',
      };
      console.warn('Using dummy auth params for CI environment');
      return new Response(JSON.stringify(dummyAuthParams), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to generate auth params' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
