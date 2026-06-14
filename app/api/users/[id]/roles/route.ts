import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { UserService } from "@/services/userService";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const assignRoleSchema = z.object({
    roleId: z.string().uuid(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "user:assign-role")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = assignRoleSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { id: userId } = await params;
    const { roleId } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    await UserService.assignRole(userId, roleId);
    return NextResponse.json({ message: "Role assigned" });
}
