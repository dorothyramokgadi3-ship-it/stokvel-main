import { FastifyInstance } from "fastify";
import { handleMessage } from "../handlers/message-handler";
import { verifyWebhookSignature } from "../utils/verify-signature";

export async function webhookRoute(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const query = request.query as Record<string, string>;
    if (query["hub.mode"] === "subscribe" && query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return reply.status(200).send(query["hub.challenge"]);
    }
    return reply.status(403).send("Forbidden");
  });

  app.post("/", async (request, reply) => {
    const signature = request.headers["x-hub-signature-256"] as string;
    if (!verifyWebhookSignature(JSON.stringify(request.body), signature)) {
      return reply.status(401).send("Invalid signature");
    }

    const body = request.body as any;
    for (const entry of body?.entry || []) {
      for (const change of entry?.changes || []) {
        if (change.field !== "messages") continue;
        const messages = change.value?.messages || [];
        const contacts = change.value?.contacts || [];
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || {};
          await handleMessage({
            from: msg.from, name: contact.profile?.name || "", type: msg.type,
            text: msg.text?.body || "", imageId: msg.image?.id,
            timestamp: msg.timestamp, messageId: msg.id,
          });
        }
      }
    }
    return reply.status(200).send("OK");
  });
}
