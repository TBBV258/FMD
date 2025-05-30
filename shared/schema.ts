import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  points: serial("points").default(0),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table for user's personal documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // bi, passaporte, carta, outros
  name: varchar("name").notNull(),
  number: varchar("number").notNull(),
  description: text("description"),
  status: varchar("status").default("active"), // active, lost
  files: jsonb("files"), // Array of file URLs/paths
  dateAdded: timestamp("date_added").defaultNow(),
  dateLost: timestamp("date_lost"),
});

// Lost documents table for community reports
export const lostDocuments = pgTable("lost_documents", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type").notNull(),
  documentName: varchar("document_name").notNull(),
  locationLost: varchar("location_lost").notNull(),
  description: text("description"),
  contactInfo: varchar("contact_info").notNull(),
  files: jsonb("files"), // Array of file URLs/paths
  status: varchar("status").default("lost"), // lost, found, claimed
  dateReported: timestamp("date_reported").defaultNow(),
  dateFound: timestamp("date_found"),
});

// Found documents table for community reports
export const foundDocuments = pgTable("found_documents", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type").notNull(),
  documentName: varchar("document_name").notNull(),
  locationFound: varchar("location_found").notNull(),
  description: text("description"),
  contactInfo: varchar("contact_info").notNull(),
  files: jsonb("files"), // Array of file URLs/paths
  status: varchar("status").default("found"), // found, claimed
  dateReported: timestamp("date_reported").defaultNow(),
  dateClaimed: timestamp("date_claimed"),
});

// Chat messages for document communication
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().notNull(),
  documentId: varchar("document_id").notNull(),
  documentType: varchar("document_type").notNull(), // lost, found, personal
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type LostDocument = typeof lostDocuments.$inferSelect;
export type InsertLostDocument = typeof lostDocuments.$inferInsert;
export type FoundDocument = typeof foundDocuments.$inferSelect;
export type InsertFoundDocument = typeof foundDocuments.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;