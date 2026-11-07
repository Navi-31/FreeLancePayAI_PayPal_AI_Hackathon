import { firestoreDb, FirestoreDatabase, Prisma, PrismaClient, Decimal } from "./firestoreDb";
import { isLiveDatabaseConfigured } from "@/backend/validation/env";

export const prisma = firestoreDb;
export const db = firestoreDb;

export { firestoreDb, FirestoreDatabase, Prisma, PrismaClient, Decimal, isLiveDatabaseConfigured };
export default firestoreDb;
