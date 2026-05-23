import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export async function hashAccessCode(code: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) =>
    scrypt(code, salt, 32, (err, key) => (err ? reject(err) : resolve(key))),
  );
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyAccessCode(code: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = await new Promise<Buffer>((resolve, reject) =>
    scrypt(code, salt, 32, (err, buf) => (err ? reject(err) : resolve(buf))),
  );
  return timingSafeEqual(Buffer.from(key, "hex"), derived);
}
