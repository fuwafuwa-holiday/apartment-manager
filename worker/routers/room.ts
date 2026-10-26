import { and, asc, eq, gte, isNull, lt, or } from 'drizzle-orm';
import dayjs from 'dayjs';
import z from 'zod';
import { apartments, rooms, tenants } from '../schema';
import { procedure, router, TRPCError } from '../trpc';

const getInput = z.object({ roomId: z.string() });

const startOfToday = () => dayjs(dayjs().format('YYYY-MM-DD')).toDate();

export const room = router({
  get: procedure.input(getInput).query(async ({ ctx, input }) => {
    const [room] = await ctx.db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
    if (!room) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const [apartment] = await ctx.db
      .select()
      .from(apartments)
      .where(eq(apartments.id, room.apartmentId))
      .limit(1);
    const tenantRows = await ctx.db.select().from(tenants).where(eq(tenants.roomId, room.id));

    const today = startOfToday();
    const tenantsWithStatus = tenantRows.map((tenant) => ({
      ...tenant,
      isResidence:
        (tenant.since === null || tenant.since <= today) && (tenant.until === null || tenant.until >= today),
    }));
    const occupancyStatus = tenantsWithStatus.some((tenant) => tenant.isResidence) ? 'residence' : 'empty';
    return { ...room, apartment, occupancyStatus, tenants: tenantsWithStatus };
  }),

  list: procedure.query(async ({ ctx }) => {
    const today = startOfToday();
    const apartmentRows = await ctx.db.select().from(apartments);
    const roomRows = await ctx.db.select().from(rooms).orderBy(asc(rooms.index));
    const tenantRows = await ctx.db
      .select()
      .from(tenants)
      .where(
        and(
          or(isNull(tenants.since), lt(tenants.since, today)),
          or(isNull(tenants.until), gte(tenants.until, today)),
        ),
      );

    const tenantsByRoom = new Map<string, typeof tenantRows>();
    for (const tenant of tenantRows) {
      const list = tenantsByRoom.get(tenant.roomId);
      if (list) {
        list.push(tenant);
      } else {
        tenantsByRoom.set(tenant.roomId, [tenant]);
      }
    }
    const roomsByApartment = new Map<string, typeof roomRows>();
    for (const room of roomRows) {
      const list = roomsByApartment.get(room.apartmentId);
      if (list) {
        list.push(room);
      } else {
        roomsByApartment.set(room.apartmentId, [room]);
      }
    }

    return apartmentRows.map((apartment) => ({
      ...apartment,
      rooms: (roomsByApartment.get(apartment.id) ?? []).map((room) => {
        const roomTenants = tenantsByRoom.get(room.id) ?? [];
        return {
          ...room,
          tenants: roomTenants,
          occupancyStatus: roomTenants.length > 0 ? 'residence' : 'empty',
        };
      }),
    }));
  }),
});
