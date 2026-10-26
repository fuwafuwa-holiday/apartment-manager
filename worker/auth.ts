import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from './env';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/**
 * Cloudflare Access の JWT を検証する。
 * ACCESS_TEAM_DOMAIN / ACCESS_AUD が未設定の場合は何もしない（Access 側の保護に任せる）。
 * @returns 認証失敗時の Response。成功（または未設定）時は null。
 */
export const verifyAccess = async (request: Request, env: Env): Promise<Response | null> => {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    return null;
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  jwks ??= createRemoteJWKSet(new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`));
  try {
    await jwtVerify(token, jwks, {
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    });
    return null;
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
};
