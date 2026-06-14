import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/cadastro'];

export function middleware(request: NextRequest) {
  // Lógica de RouteGuard
  // Verificamos o token salvo nos cookies (supondo que salvamos o token aqui para funcionar no server-side)
  // Caso não encontremos o token, redirecionamos para /login, a não ser que seja rota pública.
  const token = request.cookies.get('trackit_auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!token && !isPublicRoute) {
    // Redirecionar para login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && !isPublicRoute && !isDashboardToken(token)) {
    return NextResponse.redirect(new URL('/login?motivo=perfil', request.url));
  }

  if (token && isPublicRoute && isDashboardToken(token)) {
    // Se está logado, não tem porquê ir pro login/cadastro
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

function isDashboardToken(token: string): boolean {
  const [, payload] = token.split('.');
  if (!payload) return false;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      '=',
    );
    const decoded = JSON.parse(atob(paddedPayload)) as { tipoUsuario?: string };
    return decoded.tipoUsuario === 'ADMIN' || decoded.tipoUsuario === 'DASHBOARD';
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * E qualquer imagem na pasta assets se houver
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
