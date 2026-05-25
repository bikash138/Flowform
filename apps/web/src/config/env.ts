import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_CLIENT_URL: z.url(),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
});

if (!parsed.success) {
  console.error("Invalid environment variables:\n");
  parsed.error.issues.forEach((issue) => {
    console.error(`   • ${issue.path.join(".")} — ${issue.message}`);
  });
  throw new Error("Missing or invalid environment variables. Refusing to start.");
}

const env = parsed.data;

export default env;
