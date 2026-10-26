import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Database } from './db';

export type Context = {
  db: Database;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const procedure = t.procedure;
export { TRPCError };
