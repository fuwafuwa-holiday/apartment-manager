/**
 * API が返すエンティティの型。
 * 実体は worker/schema.ts (Drizzle) の $inferSelect と対応している。
 */

export type Apartment = {
  id: string;
  name: string;
  rent: number | null;
  waterCharge: number | null;
  parkingFee: number | null;
  commonAreaCharge: number | null;
  admin: string;
};

export type Room = {
  id: string;
  name: string;
  apartmentId: string;
  rent: number | null;
  waterCharge: number | null;
  parkingFee: number | null;
  commonAreaCharge: number | null;
  admin: string;
  index: number;
};

export type Tenant = {
  id: string;
  name: string;
  roomId: string;
  since: Date | null;
  until: Date | null;
  rent: number | null;
  waterCharge: number | null;
  parkingFee: number | null;
  commonAreaCharge: number | null;
  admin: string;
};

export type Invoice = {
  id: string;
  tenantId: string;
  month: Date;
  rent: number | null;
  waterCharge: number | null;
};
