/**
 * Prompt Sanitizer and Injection Defense Utilities
 * Protects server-side LLM calls from prompt injection, token bloat, and system overrides.
 */

// Patterns indicating potential prompt injection or system override attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
  /bypass\s+all\s+(safety|content|system)\s+filters/i,
  /system\s*:\s*you\s+are/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[SYSTEM_OVERRIDE\]/i,
  /reveal\s+(your\s+)?(system\s+prompt|api\s+key|secret)/i,
];

export interface SanitizedContent {
  sanitizedText: string;
  hadSuspiciousPatterns: boolean;
  truncated: boolean;
}

/**
 * Sanitize untrusted input before passing into LLM context.
 */
export function sanitizePromptInput(
  rawInput: string,
  maxLength: number = 12000
): SanitizedContent {
  if (!rawInput || typeof rawInput !== "string") {
    return { sanitizedText: "", hadSuspiciousPatterns: false, truncated: false };
  }

  let text = rawInput.trim();
  let truncated = false;
  let hadSuspiciousPatterns = false;

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      hadSuspiciousPatterns = true;
      // Neutralize known injection patterns without throwing fatal errors
      text = text.replace(pattern, "[FILTERED_SUSPICIOUS_PROMPT_DIRECTIVE]");
    }
  }

  // Enforce max character limit to prevent token flood attacks
  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
    truncated = true;
  }

  return {
    sanitizedText: text,
    hadSuspiciousPatterns,
    truncated,
  };
}

/**
 * Format untrusted user data safely inside isolated XML-style tags.
 * Clearly separates data context from system instructions.
 */
export function wrapUntrustedData(label: string, data: string): string {
  const sanitized = sanitizePromptInput(data).sanitizedText;
  return `<untrusted_${label}>\n${sanitized}\n</untrusted_${label}>`;
}
