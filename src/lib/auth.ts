import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // "user" | "admin". `input: false` keeps it out of sign-up and updateUser;
      // it is only changed by `npm run admin:grant`. requireAdmin() relies on
      // getSession reading it from the database, so don't enable
      // session.cookieCache without revisiting that check.
      role: { type: "string", required: false, defaultValue: "user", input: false },
    },
  },
  // nextCookies must be the last plugin in the array
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
