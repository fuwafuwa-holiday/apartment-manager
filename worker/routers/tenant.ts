import { and, asc, desc, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm';
import { ulid } from 'ulid';
import z from 'zod';
import { apartments, invoices, rooms, tenants } from '../schema';
import { procedure, router, TRPCError } from '../trpc';

const getInput = z.object({
  tenantId: z.string(),
  roomId: z.string(),
});

const tenantFields = {
  name: z.string(),
  since: z.date().nullable(),
  until: z.date().nullable(),
  rent: z.number().int().nullable(),
  waterCharge: z.number().int().nullable(),
  parkingFee: z.number().int().nullable(),
  commonAreaCharge: z.number().int().nullable(),
  admin: z.string(),
};

const createInput = z.object({
  roomId: z.string(),
  ...tenantFields,
});

const updateInput = z.object({
  id: z.string(),
  ...tenantFields,
});

const deleteInput = z.object({
  tenantId: z.string(),
});

const listOccupyingInput = z.object({
  year: z.number(),
  month: z.number(),
  tenantIds: z.array(z.string()).optional(),
});

export const tenant = router({
  get: procedure.input(getInput).query(async ({ ctx, input }) => {
    const [tenant] = await ctx.db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, input.tenantId), eq(tenants.roomId, input.roomId)))
      .limit(1);
    if (!tenant) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const [room] = await ctx.db.select().from(rooms).where(eq(rooms.id, tenant.roomId)).limit(1);
    if (!room) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const [apartment] = await ctx.db
      .select()
      .from(apartments)
      .where(eq(apartments.id, room.apartmentId))
      .limit(1);
    return { ...tenant, room: { ...room, apartment } };
  }),

  create: procedure.input(createInput).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(tenants).values({ ...input, id: ulid() });
  }),

  update: procedure.input(updateInput).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await ctx.db.update(tenants).set(data).where(eq(tenants.id, id));
  }),

  delete: procedure.input(deleteInput).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(tenants).where(eq(tenants.id, input.tenantId));
  }),

  listOccupying: procedure.input(listOccupyingInput).query(async ({ ctx, input }) => {
    const startOfMonth = new Date(input.year, input.month - 1, 1);
    const endOfMonth = new Date(input.year, input.month, 1);
    const tenantIds = input.tenantIds ?? [];

    const conditions = [
      or(isNull(tenants.since), lt(tenants.since, endOfMonth)),
      or(isNull(tenants.until), gte(tenants.until, startOfMonth)),
    ] as ReturnType<typeof or>[];
    if (tenantIds.length > 0) {
      conditions.push(inArray(tenants.id, tenantIds));
    }

    const rows = await ctx.db
      .select({ tenant: tenants, room: rooms, apartment: apartments })
      .from(tenants)
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .innerJoin(apartments, eq(rooms.apartmentId, apartments.id))
      .where(and(...conditions))
      .orderBy(desc(rooms.apartmentId), asc(rooms.index), desc(rooms.id), desc(tenants.id));

    const invoiceRows = await ctx.db.select().from(invoices).where(eq(invoices.month, startOfMonth));
    const invoicesByTenant = new Map<string, typeof invoiceRows>();
    for (const invoice of invoiceRows) {
      const list = invoicesByTenant.get(invoice.tenantId);
      if (list) {
        list.push(invoice);
      } else {
        invoicesByTenant.set(invoice.tenantId, [invoice]);
      }
    }

    return rows.map(({ tenant, room, apartment }) => ({
      ...tenant,
      room: { ...room, apartment },
      invoices: invoicesByTenant.get(tenant.id) ?? [],
    }));
  }),
});
