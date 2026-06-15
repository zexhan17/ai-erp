import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await prisma.permission.findMany({
        include: {
            rolePermissions: {
                include: { role: true },
            },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ permissions });
}
