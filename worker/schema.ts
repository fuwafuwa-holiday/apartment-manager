import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * D1 (SQLite) スキーマ。
 * 旧 Prisma スキーマ (prisma/schema.prisma) と 1:1 で対応する。
 * DateTime は Prisma と同じく UNIX ミリ秒 (INTEGER) で保持する。
 */

export const apartments = sqliteTable('apartments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  rent: integer('rent'),
  waterCharge: integer('water_charge'),
  parkingFee: integer('parking_fee'),
  commonAreaCharge: integer('common_area_charge'),
  admin: text('admin').notNull(),
});

export const rooms = sqliteTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    apartmentId: text('apartment_id')
      .notNull()
      .references(() => apartments.id),
    rent: integer('rent'),
    waterCharge: integer('water_charge'),
    parkingFee: integer('parking_fee'),
    commonAreaCharge: integer('common_area_charge'),
    admin: text('admin').notNull(),
    index: integer('index').notNull(),
  },
  (table) => [index('rooms_index_idx').on(table.index), index('rooms_apartment_id_idx').on(table.apartmentId)],
);

export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id),
    since: integer('since', { mode: 'timestamp_ms' }),
    until: integer('until', { mode: 'timestamp_ms' }),
    rent: integer('rent'),
    waterCharge: integer('water_charge'),
    parkingFee: integer('parking_fee'),
    commonAreaCharge: integer('common_area_charge'),
    admin: text('admin').notNull(),
  },
  (table) => [index('tenants_room_id_idx').on(table.roomId)],
);

export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    month: integer('month', { mode: 'timestamp_ms' }).notNull(),
    rent: integer('rent'),
    waterCharge: integer('water_charge'),
  },
  (table) => [index('invoices_tenant_id_idx').on(table.tenantId), index('invoices_month_idx').on(table.month)],
);

export type Apartment = typeof apartments.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
