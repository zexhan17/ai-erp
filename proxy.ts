import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Protect dashboard routes
    if (pathname.startsWith("/dashboard")) {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        const user = await verifyToken(token);
        if (!user) {
            const response = NextResponse.redirect(new URL("/login", req.url));
            response.cookies.delete("token");
            return response;
        }
    }

    // Redirect authenticated users away from login
    if (pathname === "/login") {
        const token = req.cookies.get("token")?.value;
        if (token) {
            const user = await verifyToken(token);
            if (user) {
                return NextResponse.redirect(new URL("/dashboard/chat", req.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login"],
};
