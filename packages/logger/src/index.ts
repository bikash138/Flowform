import pino from "pino";
import { env } from "@flowform/env";

const isDev = true;

export const logger = pino({
  level: env.node.logLevel,
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,req,res,responseTime",
          messageFormat: "{msg}",
        },
      }
    : undefined,
});

export function createLogger(module: string) {
  return logger.child({ module });
}
