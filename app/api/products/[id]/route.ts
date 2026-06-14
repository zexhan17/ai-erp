import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { ProductService } from "@/services/productService";
import { z } from "zod";

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "product:read")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const product = await ProductService.getProduct(id);
    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "product:update")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { id } = await params;
    try {
        const product = await ProductService.updateProduct(
            session.sub,
            id,
            parsed.data
        );
        return NextResponse.json({ product });
    } catch {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "product:delete")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    try {
        await ProductService.deleteProduct(session.sub, id);
        return NextResponse.json({ message: "Product deleted" });
    } catch {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
}
