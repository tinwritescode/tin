import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';
import { Redis } from '@upstash/redis';

const UPSTASH_REDIS_REST_URL = import.meta.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variable'
  );
}

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

const generateToken = (): string => {
  const token = randomBytes(32).toString('hex');
  return token;
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) {
    return new Response(JSON.stringify({ message: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existingToken = await redis.get(email);
  if (existingToken) {
    return new Response(
      JSON.stringify({
        message: 'Magic link already sent. Please check your email.',
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = generateToken();
  const expiresAt = 10 * 60; // 10 minutes in seconds
  await redis.set(email, token, { ex: expiresAt });

  const magicLink = `http://localhost:3000/api/verify-token?token=${token}`;
  console.log(`Sending magic link to ${email}: ${magicLink}`);

  return new Response(
    JSON.stringify({ message: 'Magic link sent successfully', email: email }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

  
};

export const prerender = false;
