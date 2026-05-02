import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "dotenv";
import { webhookRoute } from "./routes/webhook";
import { ozowWebhookRoute } from "./routes/ozow-webhook";

config();

const app = Fastify({ logger: true });
app.register(cors, { origin: true });
app.register(webhookRoute, { prefix: "/webhook" });
app.register(ozowWebhookRoute, { prefix: "/api/webhooks" });
app.get("/health", async () => ({ status: "ok", service: "intuthuko-bot" }));

const start = async () => {
  const port = parseInt(process.env.PORT || "3001");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Intuthuko bot running on port ${port}`);
};

start().catch(console.error);
