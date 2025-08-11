import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      email?: string | null;
      slackAccessToken?: string | null;
      name?:string|null;
     
    };
  }

  interface User {
    accessToken?: string;
    email?: string | null;
    slackAccessToken?: string | null;
    name?:string|null;
  }
}