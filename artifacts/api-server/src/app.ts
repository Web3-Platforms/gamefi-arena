import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Allow the Replit dev domain and any explicitly configured ALLOWED_ORIGIN.
// Same-origin requests (no Origin header) are always allowed.
const allowedOrigins = new Set(
  [process.env.REPLIT_DEV_DOMAIN, process.env.ALLOWED_ORIGIN]
    .filter(Boolean)
    .map((o) => (o!.startsWith("http") ? o! : `https://${o!}`)),
);
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.has(origin) ? cb(null, true) : cb(new Error("CORS: origin not allowed")),
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
