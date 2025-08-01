import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    // Redirect unauthenticated users to login
    if (!['/login', '/register'].includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // Redirect authenticated users away from login/register pages
    if (['/login', '/register'].includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - images/ (public static images)
     * - android-chrome, apple-touch-icon, favicon (icon files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|android-chrome|apple-touch-icon|favicon).*)',
  ],
};
