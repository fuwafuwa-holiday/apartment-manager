CREATE TABLE `apartments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rent` integer,
	`water_charge` integer,
	`parking_fee` integer,
	`common_area_charge` integer,
	`admin` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`month` integer NOT NULL,
	`rent` integer,
	`water_charge` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invoices_tenant_id_idx` ON `invoices` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `invoices_month_idx` ON `invoices` (`month`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`apartment_id` text NOT NULL,
	`rent` integer,
	`water_charge` integer,
	`parking_fee` integer,
	`common_area_charge` integer,
	`admin` text NOT NULL,
	`index` integer NOT NULL,
	FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rooms_index_idx` ON `rooms` (`index`);--> statement-breakpoint
CREATE INDEX `rooms_apartment_id_idx` ON `rooms` (`apartment_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`room_id` text NOT NULL,
	`since` integer,
	`until` integer,
	`rent` integer,
	`water_charge` integer,
	`parking_fee` integer,
	`common_area_charge` integer,
	`admin` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tenants_room_id_idx` ON `tenants` (`room_id`);