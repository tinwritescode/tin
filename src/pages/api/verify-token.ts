// src/pages/api/verify-token.ts
import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false
const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Token is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  try {
    const email = await redis.get<string>(token);
    if (!email) {
      return new Response(
        JSON.stringify({ message: 'Invalid or expired token' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const result = await redis.del(token)
    console.log(result)
    if(result === 0) {
        return new Response(
            JSON.stringify({ message: 'Token already used' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
    }
    return new Response(
      JSON.stringify({ message: 'Token verified successfully', email }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying token:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};