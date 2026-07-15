import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./db"
import { TipoUsuario } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.senhaHash) {
          return null
        }

        const passwordMatch = await compare(credentials.password, user.senhaHash)

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.tipo,
          empresaId: user.empresaId
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.empresaId = user.empresaId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as TipoUsuario
        session.user.empresaId = token.empresaId as string
      }
      return session
    }
  }
}

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role?: TipoUsuario
    empresaId?: string
  }

  interface Session {
    user: {
      id?: string
      role?: TipoUsuario
      empresaId?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: TipoUsuario
    empresaId?: string
  }
}