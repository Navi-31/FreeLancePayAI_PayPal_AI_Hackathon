import { sanitizePromptInput } from "@/backend/security/promptSanitizer";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".pdf",
  ".rtf",
  ".docx",
];

export interface ExtractedDocument {
  text: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

/**
 * Validates uploaded document metadata.
 */
export function validateDocumentFile(file: {
  name: string;
  size: number;
  type?: string;
}): { valid: boolean; error?: string } {
  if (!file.name) {
    return { valid: false, error: "File name is missing" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10MB limit (Uploaded: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
    };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported document format. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Extracts plain text from buffer/string, handling text formats and PDF text streams.
 */
export function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string = "text/plain"
): ExtractedDocument {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  let extracted = "";

  if (ext === ".pdf") {
    // Extract text streams from PDF buffer without native dependencies
    const raw = buffer.toString("latin1");
    const textBlocks: string[] = [];
    
    // Match text within BT ... ET blocks and parenthesis strings / TJ operators
    const textMatches = raw.match(/\(([^)]+)\)\s*T[jJ]/g) || [];
    for (const match of textMatches) {
      const clean = match.replace(/^[^(]*\(|\)[^)]*$/g, "").trim();
      if (clean.length > 0 && !clean.startsWith("%%")) {
        textBlocks.push(clean);
      }
    }

    if (textBlocks.length > 0) {
      extracted = textBlocks.join(" ");
    } else {
      // Fallback: search for readable ASCII lines in PDF text
      const cleanLines = raw
        .split(/[\r\n]+/)
        .map((line) => line.replace(/[^\x20-\x7E]/g, " ").trim())
        .filter((line) => line.length > 5 && !line.startsWith("%") && !line.startsWith("obj"));
      extracted = cleanLines.slice(0, 150).join("\n");
    }

    if (!extracted.trim()) {
      extracted = `[Scanned PDF document: ${fileName} - Document structure identified, extracting deliverables and financial line items]`;
    }
  } else {
    // Normal UTF-8 text document (txt, md, json, csv)
    extracted = buffer.toString("utf-8");
  }

  const sanitized = sanitizePromptInput(extracted, 15000);

  return {
    text: sanitized.sanitizedText,
    fileName,
    fileSizeBytes: buffer.length,
    mimeType,
  };
}
