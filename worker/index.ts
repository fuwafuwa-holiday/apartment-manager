import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { verifyAccess } from './auth';
import { createDb } from './db';
import type { Env } from './env';
import { appRouter } from './routers';

const API_PREFIX = '/api/trpc';

const corsHeaders = (request: Request, env: Env): Record<string, string> => {
  const origin = request.headers.get('origin');
  if (!origin || !env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) {
    return {};
  }
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'content-type, cf-access-jwt-assertion',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    vary: 'origin',
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
      const cors = corsHeaders(request, env);
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }

      const unauthorized = await verifyAccess(request, env);
      if (unauthorized) {
        return unauthorized;
      }

      const response = await fetchRequestHandler({
        endpoint: API_PREFIX,
        req: request,
        router: appRouter,
        createContext: () => ({ db: createDb(env.DB) }),
      });
      for (const [key, value] of Object.entries(cors)) {
        response.headers.set(key, value);
      }
      return response;
    }

    // それ以外は静的アセット (renderer/out)。未知のパスは SPA フォールバックで index.html。
    return env.ASSETS.fetch(request);
  },
};
