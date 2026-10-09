import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate for /admin: requests without a session cookie get a real
// 404 without rendering anything. This only checks that a cookie exists, so
// it is not the security boundary — requireAdmin() in src/lib/admin.ts is.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
