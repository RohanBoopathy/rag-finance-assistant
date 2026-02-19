import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/sign-in' || request.nextUrl.pathname === '/sign-up';

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/sign-in', '/sign-up', '/dashboard/:path*', '/ai-assistant/:path*', '/app-settings/:path*', '/fraud-detection/:path*', '/transactions/:path*'],
};
