import { apartment } from './apartment';
import { invoice } from './invoice';
import { room } from './room';
import { tenant } from './tenant';
import { router } from '../trpc';

export const appRouter = router({
  apartment,
  room,
  tenant,
  invoice,
});

export type AppRouter = typeof appRouter;
