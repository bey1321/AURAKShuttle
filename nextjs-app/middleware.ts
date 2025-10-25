import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get user role from session/cookie (you can implement this based on your auth system)
  const userRole = request.cookies.get("userRole")?.value || "user";
  
  // Define role-based access
  const roleAccess = {
    user: ["/user"],
    driver: ["/driver"],
    admin: ["/admin", "/user", "/driver"], // Admin can access all
  };
  
  // Check if user has access to the current path
  const hasAccess = roleAccess[userRole as keyof typeof roleAccess]?.some(role => 
    pathname.startsWith(role)
  )
  
  // If accessing a role-specific page without proper access, redirect to login
  if (
    pathname.startsWith("/user") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin")
  ) {
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/user/:path*", "/driver/:path*", "/admin/:path*"],
};