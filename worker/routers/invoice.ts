import { and, eq } from 'drizzle-orm';
import dayjs from 'dayjs';
import { ulid } from 'ulid';
import z from 'zod';
import { invoices } from '../schema';
import { procedure, router } from '../trpc';

const updateInput = z.object({
  month: z.string(),
  invoices: z.array(
    z.object({
      id: z.string().nullable(),
      tenantId: z.string(),
      waterCharge: z.number().nullable(),
    }),
  ),
});

export const invoice = router({
  update: procedure.input(updateInput).mutation(async ({ ctx, input }) => {
    const month = dayjs(input.month).toDate();
    for (const item of input.invoices) {
      if (item.id == null) {
        await ctx.db.insert(invoices).values({
          id: ulid(),
          tenantId: item.tenantId,
          month,
          waterCharge: item.waterCharge,
        });
      } else {
        await ctx.db
          .update(invoices)
          .set({ waterCharge: item.waterCharge })
          .where(and(eq(invoices.id, item.id), eq(invoices.month, month), eq(invoices.tenantId, item.tenantId)));
      }
    }
  }),
});
