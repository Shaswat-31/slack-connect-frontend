import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If user is logged in and tries to visit login page -> redirect
  if (pathname === "/" && token) {
    // If slackAccessToken exists -> workspace
    if (token.slackAccessToken) {
      return NextResponse.redirect(new URL("/dashboard/workspace", req.url));
    }
    // Otherwise -> normal dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If already logged in and accessing /dashboard, decide workspace vs dashboard
  if (pathname === "/dashboard" && token?.slackAccessToken) {
    return NextResponse.redirect(new URL("/dashboard/workspace", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
