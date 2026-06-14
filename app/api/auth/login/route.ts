import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_OPTIONS } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
        );
    }

    const token = await signToken({ sub: user.id, email: user.email });
    const response = NextResponse.json({
        user: { id: user.id, email: user.email },
    });
    response.cookies.set("token", token, COOKIE_OPTIONS);
    return response;
}
