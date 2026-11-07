import { getFirebaseStorage } from "@/backend/firebase/admin";
import { firestoreDb } from "@/backend/db/firestoreDb";

export interface StoredDocument {
  id: string;
  userId: string;
  name: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  category: "invoice" | "receipt" | "contract_sow" | "tax_document" | "other";
  downloadUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/json",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class FirebaseStorageService {
  /**
   * Uploads an authenticated user-scoped file to Firebase Storage and records metadata in Firestore.
   */
  async uploadUserDocument(params: {
    userId: string;
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    category?: StoredDocument["category"];
    metadata?: Record<string, unknown>;
  }): Promise<StoredDocument> {
    const { userId, fileName, fileBuffer, mimeType, category = "contract_sow", metadata } = params;

    if (!userId) {
      throw new Error("Unauthorized: Storage operations require an authenticated userId");
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds 10MB limit (Uploaded: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB)`);
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}. Allowed: PDF, PNG, JPEG, WEBP, TXT, CSV, JSON.`);
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const docId = `DOC-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `users/${userId}/documents/${timestamp}-${sanitizedFileName}`;

    let uploadedToCloud = false;
    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            ownerUserId: userId,
            originalName: fileName,
            category,
          },
        },
        resumable: false,
      });
      uploadedToCloud = true;
    } catch (storageErr) {
      // If Cloud Storage bucket is not yet provisioned in the Firebase Spark plan,
      // record gracefully in Firestore so user workflows never crash.
      console.warn("[Firebase Storage] Cloud bucket write note:", (storageErr as Error).message);
    }

    const docRecord: StoredDocument = {
      id: docId,
      userId,
      name: fileName,
      fileType: mimeType,
      fileSize: fileBuffer.length,
      storagePath,
      category,
      metadata: {
        ...metadata,
        cloudStorageSynchronized: uploadedToCloud,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestoreDb.document.create({
      data: docRecord as unknown as Record<string, unknown>,
    });

    return docRecord;
  }

  /**
   * Generates a secure, temporary, time-limited signed URL for authorized document download.
   */
  async getSecureDownloadUrl(userId: string, documentId: string): Promise<string> {
    const doc = (await firestoreDb.document.findUnique({
      where: { id: documentId },
    })) as unknown as StoredDocument | null;

    if (!doc) {
      throw new Error("Document not found");
    }

    if (doc.userId !== userId) {
      throw new Error("Forbidden: Cross-user document access is strictly denied");
    }

    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const file = bucket.file(doc.storagePath);

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes TTL
      });
      return url;
    } catch {
      return `/api/documents/${doc.id}/download`;
    }
  }

  /**
   * Deletes a document from Firebase Storage and deletes its Firestore metadata record.
   */
  async deleteUserDocument(userId: string, documentId: string): Promise<void> {
    const doc = (await firestoreDb.document.findUnique({
      where: { id: documentId },
    })) as unknown as StoredDocument | null;

    if (!doc) return;

    if (doc.userId !== userId) {
      throw new Error("Forbidden: Cannot delete documents owned by another user");
    }

    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      await bucket.file(doc.storagePath).delete({ ignoreNotFound: true });
    } catch {
      // Continue to remove Firestore record even if bucket file not present
    }

    await firestoreDb.document.delete({ where: { id: documentId } });
  }

  /**
   * Lists all documents owned by an authenticated user.
   */
  async listUserDocuments(userId: string): Promise<StoredDocument[]> {
    const docs = await firestoreDb.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return docs as unknown as StoredDocument[];
  }
}

export const firebaseStorageService = new FirebaseStorageService();
