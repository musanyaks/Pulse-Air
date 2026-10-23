import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  real,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 128 }).notNull(),
    country: varchar("country", { length: 64 }),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("UTC"),
    population: integer("population"),
    elevation: real("elevation"),
    source: varchar("source", { length: 64 }).default("open-meteo"),
    isActive: boolean("is_active").default(true).notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    coordsIdx: index("locations_coords_idx").on(table.latitude, table.longitude),
    activeIdx: index("locations_active_idx").on(table.isActive),
  })
);

export const readings = pgTable(
  "readings",
  {
    id: serial("id").primaryKey(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    pm25: real("pm25"),
    pm10: real("pm10"),
    o3: real("o3"),
    no2: real("no2"),
    so2: real("so2"),
    co: real("co"),
    aqi: integer("aqi"),
    dominantPollutant: varchar("dominant_pollutant", { length: 16 }),
    category: varchar("category", { length: 32 }),
    healthAdvice: text("health_advice"),
    forecast: boolean("forecast").default(false).notNull(),
    source: varchar("source", { length: 64 }).default("open-meteo"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    locationTimeIdx: uniqueIndex("readings_location_time_idx").on(
      table.locationId,
      table.measuredAt,
      table.forecast
    ),
    measuredAtIdx: index("readings_measured_at_idx").on(table.measuredAt),
    forecastIdx: index("readings_forecast_idx").on(table.forecast),
    aqiIdx: index("readings_aqi_idx").on(table.aqi),
  })
);

export const alertConfigs = pgTable(
  "alert_configs",
  {
    id: serial("id").primaryKey(),
    locationId: integer("location_id").references(() => locations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    email: varchar("email", { length: 256 }),
    metric: varchar("metric", { length: 16 }).notNull(), // aqi | pm25 | pm10 | o3 | no2
    operator: varchar("operator", { length: 4 }).notNull(), // gt | gte | lt | lte
    threshold: real("threshold").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    cooldownMinutes: integer("cooldown_minutes").default(60),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index("alert_configs_active_idx").on(table.isActive),
    locationIdx: index("alert_configs_location_idx").on(table.locationId),
  })
);

export const alertLogs = pgTable(
  "alert_logs",
  {
    id: serial("id").primaryKey(),
    alertId: integer("alert_id")
      .notNull()
      .references(() => alertConfigs.id, { onDelete: "cascade" }),
    locationId: integer("location_id").references(() => locations.id, { onDelete: "cascade" }),
    metric: varchar("metric", { length: 16 }).notNull(),
    threshold: real("threshold").notNull(),
    observedValue: real("observed_value").notNull(),
    message: text("message").notNull(),
    acknowledged: boolean("acknowledged").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    alertIdx: index("alert_logs_alert_idx").on(table.alertId),
    createdIdx: index("alert_logs_created_idx").on(table.createdAt),
  })
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Reading = typeof readings.$inferSelect;
export type NewReading = typeof readings.$inferInsert;
export type AlertConfig = typeof alertConfigs.$inferSelect;
export type NewAlertConfig = typeof alertConfigs.$inferInsert;
export type AlertLog = typeof alertLogs.$inferSelect;
export type NewAlertLog = typeof alertLogs.$inferInsert;
