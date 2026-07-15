import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { TipoUsuario } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Proteção de rotas admin
    if (pathname.startsWith("/admin") && token?.role !== TipoUsuario.ADMIN) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Proteção de rotas field
    if (pathname.startsWith("/field") && token?.role !== TipoUsuario.VISTORIADOR) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: "/login"
    }
  }
)

export const config = {
  matcher: ["/admin/:path*", "/field/:path*"]
}