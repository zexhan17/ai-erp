import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissions } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const permissions = await getUserPermissions(session.sub);
    return NextResponse.json({ user, permissions });
}
