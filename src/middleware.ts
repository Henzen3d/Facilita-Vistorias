import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { TipoUsuario } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Proteção de rotas admin — só ADMIN
    if (pathname.startsWith("/admin") && token?.role !== TipoUsuario.ADMIN) {
      // Vistoriador autenticado volta ao app de campo; anônimo cai no login
      if (token?.role === TipoUsuario.VISTORIADOR) {
        return NextResponse.redirect(new URL("/field", req.url))
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Proteção de rotas field — só VISTORIADOR (login de campo é excluído do matcher)
    if (pathname.startsWith("/field") && token?.role !== TipoUsuario.VISTORIADOR) {
      if (token?.role === TipoUsuario.ADMIN) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  // /field/login fica público (fora do matcher) para o vistoriador autenticar
  matcher: ["/admin/:path*", "/field", "/field/((?!login).*)"],
}
