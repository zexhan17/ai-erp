import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { UserService } from "@/services/userService";
import { z } from "zod";

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

async function requireSuperadmin(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) return null;
    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "user:create")) return null;
    return session;
}

export async function GET(req: NextRequest) {
    const session = await requireSuperadmin(req);
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await UserService.getUsers();
    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const session = await requireSuperadmin(req);
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { email, password } = parsed.data;

    const existing = await import("@/lib/prisma").then(({ prisma }) =>
        prisma.user.findUnique({ where: { email } })
    );
    if (existing) {
        return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 }
        );
    }

    const user = await UserService.createUser(email, password);
    return NextResponse.json({ user }, { status: 201 });
}
