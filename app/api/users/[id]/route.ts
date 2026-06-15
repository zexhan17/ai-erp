import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { UserService } from "@/services/userService";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "user:create")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    try {
        await UserService.deleteUser(id);
        return NextResponse.json({ message: "User deleted" });
    } catch {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
}
