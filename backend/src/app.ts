import express from "express";
import eventRoutes from "./modules/event/event.routes.js";
import rsvpRoutes from "./modules/rsvp/rsvp.routes.js";
import photoRoutes from "./modules/photo/photo.routes.js";
import guestListRoutes from "./modules/guest-list/guest-list.routes.js";
import cors from "cors";

const app = express();

const configuredOrigins = process.env.CORS_ORIGINS?.split(",") ?? [];
const renderFrontendOrigin = process.env.FRONTEND_HOST
  ? `https://${process.env.FRONTEND_HOST}`
  : undefined;
const allowedOrigins = [...configuredOrigins, renderFrontendOrigin]
  .filter((origin): origin is string => Boolean(origin))
  .map(origin => origin.trim().replace(/\/$/, ""));

app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : undefined));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/events", eventRoutes);
app.use("/rsvp", rsvpRoutes);
app.use("/photos", photoRoutes);
app.use("/guest-list", guestListRoutes);

export default app;
