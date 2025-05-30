import {
  users,
  documents,
  lostDocuments,
  foundDocuments,
  chatMessages,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type LostDocument,
  type InsertLostDocument,
  type FoundDocument,
  type InsertFoundDocument,
  type ChatMessage,
  type InsertChatMessage,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations
  getUserDocuments(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<boolean>;
  
  // Lost document operations
  getLostDocuments(): Promise<LostDocument[]>;
  createLostDocument(lostDoc: InsertLostDocument): Promise<LostDocument>;
  updateLostDocument(id: string, updates: Partial<LostDocument>): Promise<LostDocument | undefined>;
  
  // Found document operations
  getFoundDocuments(): Promise<FoundDocument[]>;
  createFoundDocument(foundDoc: InsertFoundDocument): Promise<FoundDocument>;
  updateFoundDocument(id: string, updates: Partial<FoundDocument>): Promise<FoundDocument | undefined>;
  
  // Chat operations
  getChatMessages(documentId: string, documentType: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Document operations
  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.dateAdded));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values(document)
      .returning();
    return doc;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const [doc] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return doc;
  }

  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return result.rowCount > 0;
  }

  // Lost document operations
  async getLostDocuments(): Promise<LostDocument[]> {
    return await db
      .select()
      .from(lostDocuments)
      .where(eq(lostDocuments.status, 'lost'))
      .orderBy(desc(lostDocuments.dateReported));
  }

  async createLostDocument(lostDoc: InsertLostDocument): Promise<LostDocument> {
    const [doc] = await db
      .insert(lostDocuments)
      .values(lostDoc)
      .returning();
    return doc;
  }

  async updateLostDocument(id: string, updates: Partial<LostDocument>): Promise<LostDocument | undefined> {
    const [doc] = await db
      .update(lostDocuments)
      .set(updates)
      .where(eq(lostDocuments.id, id))
      .returning();
    return doc;
  }

  // Found document operations
  async getFoundDocuments(): Promise<FoundDocument[]> {
    return await db
      .select()
      .from(foundDocuments)
      .where(eq(foundDocuments.status, 'found'))
      .orderBy(desc(foundDocuments.dateReported));
  }

  async createFoundDocument(foundDoc: InsertFoundDocument): Promise<FoundDocument> {
    const [doc] = await db
      .insert(foundDocuments)
      .values(foundDoc)
      .returning();
    return doc;
  }

  async updateFoundDocument(id: string, updates: Partial<FoundDocument>): Promise<FoundDocument | undefined> {
    const [doc] = await db
      .update(foundDocuments)
      .set(updates)
      .where(eq(foundDocuments.id, id))
      .returning();
    return doc;
  }

  // Chat operations
  async getChatMessages(documentId: string, documentType: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.documentId, documentId),
        eq(chatMessages.documentType, documentType)
      ))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();