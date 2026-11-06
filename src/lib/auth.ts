import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { env } from "./env";

export const SESSION_COOKIE_NAME = "freelancepay_session";
const JWT_SECRET_ENCODED = new TextEncoder().encode(env.JWT_SECRET);
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  badge?: string;
  [key: string]: unknown;
}

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a signed JWT token containing the user's session payload.
 */
export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(JWT_SECRET_ENCODED);
}

/**
 * Verifies and decodes a signed JWT session token.
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current session from incoming cookies.
 */
export async function getServerSession(): Promise<AuthSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Enforces authentication on server operations or API routes.
 * Throws an Error if unauthenticated.
 */
export async function requireAuth(): Promise<AuthSessionPayload> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
