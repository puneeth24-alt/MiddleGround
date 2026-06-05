import { relations } from "drizzle-orm";
import { decimal, index, integer, pgTable, primaryKey, smallint, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state")
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerAccountId] })
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] })
  })
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("Our Meeting Point"),
    shareToken: varchar("share_token", { length: 64 }).unique().notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    radiusMeters: integer("radius_meters").notNull().default(1000),
    midpointLat: decimal("midpoint_lat", { precision: 10, scale: 8 }),
    midpointLng: decimal("midpoint_lng", { precision: 11, scale: 8 }),
    maxParticipants: smallint("max_participants").notNull().default(20),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
  },
  (table) => ({
    ownerIdx: index("idx_plans_owner").on(table.ownerId),
    tokenIdx: index("idx_plans_share_token").on(table.shareToken)
  })
);

export const planParticipants = pgTable(
  "plan_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    nickname: varchar("nickname", { length: 100 }).notNull(),
    avatarColor: varchar("avatar_color", { length: 7 }).notNull().default("#2563eb"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow()
  },
  (table) => ({
    planIdx: index("idx_participants_plan").on(table.planId),
    userSeat: unique("uniq_participant_user_per_plan").on(table.planId, table.userId)
  })
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => planParticipants.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
    lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
  },
  (table) => ({
    planIdx: index("idx_locations_plan").on(table.planId),
    participantLocation: unique("uniq_location_per_participant_plan").on(table.participantId, table.planId)
  })
);

export const planRelations = relations(plans, ({ many, one }) => ({
  owner: one(users, { fields: [plans.ownerId], references: [users.id] }),
  participants: many(planParticipants),
  locations: many(locations)
}));

export const participantRelations = relations(planParticipants, ({ one }) => ({
  plan: one(plans, { fields: [planParticipants.planId], references: [plans.id] }),
  user: one(users, { fields: [planParticipants.userId], references: [users.id] })
}));
