import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-me-in-production"
);

export interface JWTPayload {
    sub: string;
    email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function getSessionUser(
    req?: NextRequest
): Promise<JWTPayload | null> {
    let token: string | undefined;

    if (req) {
        token = req.cookies.get("token")?.value;
    } else {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value;
    }

    if (!token) return null;
    return verifyToken(token);
}

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};
