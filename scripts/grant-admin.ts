// Grants or revokes admin access for an existing account:
//   npm run admin:grant -- someone@example.com
//   npm run admin:grant -- someone@example.com --revoke
//
// The only way to change a user's role; there is deliberately no endpoint for it.
// Builds its own client because `src/db/index.ts` is `server-only`.

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = drizzle({ client: neon(process.env.DATABASE_URL), schema });
const { user } = schema;

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
  }

  const role = revoke ? "user" : "admin";
  const rows = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email))
    .returning({ email: user.email });

  if (rows.length === 0) {
    console.error(`No account with email ${email}. Sign up at /account first.`);
    process.exit(1);
  }

  console.log(`${email} now has role "${role}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
