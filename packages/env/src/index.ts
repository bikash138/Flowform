import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  PORT: z.coerce.number().default(4000),
  BASE_URL: z.url(),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  FRONTEND_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  AWS_REGION: z.string(),
  AWS_ENDPOINT_URL_S3: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
});

export const serverEnvSchema = serverSchema
  .superRefine((e, ctx) => {
    if (e.NODE_ENV === "production" && !e.COOKIE_DOMAIN) {
      ctx.addIssue({
        code: "custom",
        path: ["COOKIE_DOMAIN"],
        message: "COOKIE_DOMAIN is required in production",
      });
    }
  })
  .transform((e) => ({
  node: { env: e.NODE_ENV, logLevel: e.LOG_LEVEL },
  http: { port: e.PORT, frontendUrl: e.FRONTEND_URL, baseUrl: e.BASE_URL },
  infra: {
    database: { url: e.DATABASE_URL },
    redis: { url: e.REDIS_URL },
  },
  auth: {
    secret: e.BETTER_AUTH_SECRET,
    baseURL: e.BETTER_AUTH_URL,
    cookieDomain: e.COOKIE_DOMAIN,
    providers: {
      google: {
        clientId: e.GOOGLE_CLIENT_ID,
        clientSecret: e.GOOGLE_CLIENT_SECRET,
      },
    },
  },
  email: { resend: e.RESEND_API_KEY },
  s3: {
    region: e.AWS_REGION,
    endpoint: e.AWS_ENDPOINT_URL_S3,
    accessKeyId: e.AWS_ACCESS_KEY_ID,
    secretAccessKey: e.AWS_SECRET_ACCESS_KEY,
    bucketName: e.S3_BUCKET_NAME,
  },
}));

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n");
  parsed.error.issues.forEach((issue) => {
    console.error(`   • ${issue.path.join(".")} — ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
