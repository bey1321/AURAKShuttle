import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { mockUsers } from "../../../_lib/mockUsers";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Find user in local mock data
        const user = mockUsers.find(
          (u) =>
            u.email === credentials?.email &&
            u.password === credentials?.password
        );
        if (user) return user;
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        // Cast user to include the 'role' property
        token.role = (user as typeof user & { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {} as typeof session.user & { role?: string };
      }
      (session.user as typeof session.user & { role?: string }).role = (token as any).role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
