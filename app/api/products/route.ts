import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions, checkPermission } from "@/lib/permissions";
import { ProductService } from "@/services/productService";
import { z } from "zod";

const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
});

export async function GET(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "product:read")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await ProductService.getProducts();
    return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermissions(session.sub);
    if (!checkPermission(permissions, "product:create")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const product = await ProductService.createProduct(session.sub, parsed.data);
    return NextResponse.json({ product }, { status: 201 });
}
