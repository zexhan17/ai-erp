import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, COOKIE_OPTIONS } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: NextRequest) {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(sessionUser.sub);
    if (!checkPermission(permissions, "user:create")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 }
        );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true },
    });

    const token = await signToken({ sub: user.id, email: user.email });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set("token", token, COOKIE_OPTIONS);
    return response;
}
