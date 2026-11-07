import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { analyzeDocumentContent } from "@/backend/services/aiService";
import {
  validateDocumentFile,
  extractTextFromBuffer,
} from "@/backend/integrations/gemini/documentExtractor";
import { z } from "zod";

const jsonScanSchema = z.object({
  documentText: z.string().min(5, "Document text is too short"),
  fileName: z.string().default("document.txt"),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
      }

      const validation = validateDocumentFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extracted = extractTextFromBuffer(buffer, file.name, file.type);

      const result = await analyzeDocumentContent(
        session.userId,
        extracted.text,
        file.name
      );

      return NextResponse.json({
        ...result,
        fileMeta: {
          name: file.name,
          size: file.size,
        },
      });
    }

    // Direct JSON payload
    const body = await request.json();
    const validated = jsonScanSchema.parse(body);

    const result = await analyzeDocumentContent(
      session.userId,
      validated.documentText,
      validated.fileName
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze document";
    console.error("Scanner analyze error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
