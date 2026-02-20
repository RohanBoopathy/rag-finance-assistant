import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password
            })
          })
          
          if (!res.ok) {
            return null
          }

          const data = await res.json()

          if (data.token) {
            return {
              id: data.user?.id || data.token,
              name: data.user?.name,
              email: data.user?.email || credentials?.email,
              token: data.token,
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.userId = user.id ?? token.sub;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
        const resolvedUserId = token.userId ?? token.sub
        session.accessToken = token.accessToken
        session.user = {
          _id: resolvedUserId,
          id: resolvedUserId,
          name: token.name,
          email: token.email,
        }
      return session
    }
  },
  
  pages: {
    signIn: '/sign-in',
    error: '/sign-in'
  },

  session: {
    strategy: 'jwt' as const,
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
