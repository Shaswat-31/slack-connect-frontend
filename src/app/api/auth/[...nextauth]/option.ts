import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        try {
          const res = await fetch(`${backendBaseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null; 
          }

          const data = await res.json();
          console.log("session data",data);
          return {
            email: credentials.email,
            accessToken: data.accessToken,
            name:data.name,
            slackAccessToken: data.slackAccessToken || null,
          };
        } catch (err: any) {
          console.error("Login error", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On first login, store access token and any user info
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.email = (user as any).email;
        token.slackAccessToken = typeof (user as any).slackAccessToken === "string"
  ? (user as any).slackAccessToken
  : null;
  token.name = typeof (user as any).name === "string"
  ? (user as any).name
  : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
         session.accessToken = token.accessToken as string;
       
        if (session.user) {
          session.user.email = token.email as string;
          session.user.slackAccessToken = token.slackAccessToken as string | null;
          session.user.name=token.name as string | null;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};
