import { asc, eq, inArray } from 'drizzle-orm';
import { ulid } from 'ulid';
import z from 'zod';
import { apartments, rooms } from '../schema';
import { procedure, router, TRPCError } from '../trpc';
import { makeArrayDiff } from '../util';

const getInput = z.object({
  apartmentId: z.string(),
});

const apartmentFields = {
  name: z.string(),
  rent: z.number().int().nullable(),
  waterCharge: z.number().int().nullable(),
  parkingFee: z.number().int().nullable(),
  commonAreaCharge: z.number().int().nullable(),
  admin: z.string(),
};

const roomInput = z.object({
  name: z.string(),
  rent: z.number().int().nullable(),
  waterCharge: z.number().int().nullable(),
  parkingFee: z.number().int().nullable(),
  commonAreaCharge: z.number().int().nullable(),
  admin: z.string(),
});

const createInput = z.object({
  ...apartmentFields,
  rooms: z.array(roomInput),
});

const updateInput = z.object({
  ...apartmentFields,
  id: z.string(),
  rooms: z.array(roomInput.extend({ id: z.string().nullable() })),
});

const deleteInput = z.object({ apartmentId: z.string() });

export const apartment = router({
  list: procedure.query(async ({ ctx }) => {
    const apartmentRows = await ctx.db.select().from(apartments);
    const roomRows = await ctx.db.select().from(rooms).orderBy(asc(rooms.index));
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
      rooms: roomsByApartment.get(apartment.id) ?? [],
    }));
  }),

  get: procedure.input(getInput).query(async ({ ctx, input }) => {
    const [apartment] = await ctx.db.select().from(apartments).where(eq(apartments.id, input.apartmentId)).limit(1);
    if (!apartment) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const roomRows = await ctx.db
      .select()
      .from(rooms)
      .where(eq(rooms.apartmentId, apartment.id))
      .orderBy(asc(rooms.index));
    return { ...apartment, rooms: roomRows };
  }),

  create: procedure.input(createInput).mutation(async ({ ctx, input }) => {
    const id = ulid();
    const { rooms: roomInputs, ...apartmentInput } = input;
    const roomRows = roomInputs.map((room, index) => ({
      ...room,
      id: ulid(),
      apartmentId: id,
      index,
    }));
    await ctx.db.batch([
      ctx.db.insert(apartments).values({ id, ...apartmentInput }),
      ...roomRows.map((room) => ctx.db.insert(rooms).values(room)),
    ]);
    return { id, ...apartmentInput };
  }),

  update: procedure.input(updateInput).mutation(async ({ ctx, input }) => {
    const { id, rooms: roomInputs, ...apartmentInput } = input;
    await ctx.db.update(apartments).set(apartmentInput).where(eq(apartments.id, id));

    const existing = await ctx.db.select().from(rooms).where(eq(rooms.apartmentId, id));
    const next = roomInputs.map((room, index) => ({ ...room, apartmentId: id, index }));
    const { created, updated, deleted } = makeArrayDiff(existing, next);

    for (const room of created) {
      await ctx.db.insert(rooms).values({ ...room, id: ulid() });
    }
    for (const room of updated) {
      await ctx.db.update(rooms).set(room).where(eq(rooms.id, room.id));
    }
    if (deleted.length > 0) {
      await ctx.db.delete(rooms).where(inArray(rooms.id, deleted));
    }
  }),

  delete: procedure.input(deleteInput).mutation(async ({ ctx, input }) => {
    await ctx.db.batch([
      ctx.db.delete(rooms).where(eq(rooms.apartmentId, input.apartmentId)),
      ctx.db.delete(apartments).where(eq(apartments.id, input.apartmentId)),
    ]);
  }),
});
