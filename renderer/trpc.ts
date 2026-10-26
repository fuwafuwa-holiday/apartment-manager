import { createTRPCNext } from '@trpc/next';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../worker/routers';

/**
 * API の URL。既定は同一オリジン (Worker が静的アセットと API を同時に配信)。
 * `next dev` で Worker を別ポートに立てる場合は
 *   NEXT_PUBLIC_API_URL=http://localhost:8787/api/trpc next dev renderer
 * のように指定する。
 */
const url = process.env.NEXT_PUBLIC_API_URL ?? '/api/trpc';

const links = [httpBatchLink({ url })];

export const nextClient = createTRPCNext<AppRouter>({
  config() {
    return {
      links,
      transformer: superjson,
    };
  },
  ssr: false,
});

export const client = createTRPCProxyClient<AppRouter>({
  links,
  transformer: superjson,
});
