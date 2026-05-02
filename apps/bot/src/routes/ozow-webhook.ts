import { FastifyInstance } from "fastify";
import { db } from "@intuthuko/db";
import { sendWhatsApp } from "../utils/whatsapp-api";
import { formatCents } from "../utils/format";

export async function ozowWebhookRoute(app: FastifyInstance) {
  app.post("/ozow", async (request, reply) => {
    const body = request.body as any;
    const { TransactionId, StatusMessage, Amount, TransactionReference } = body;

    if (StatusMessage !== "Complete") {
      console.log(`Ozow ${TransactionId}: ${StatusMessage}`);
      return reply.status(200).send("OK");
    }

    const contribution = await db.contribution.findFirst({
      where: { reference: TransactionReference, status: "PENDING" },
      include: { user: true, group: true },
    });

    if (!contribution) {
      console.error(`No pending contribution for ref: ${TransactionReference}`);
      return reply.status(200).send("OK");
    }

    await db.contribution.update({
      where: { id: contribution.id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    await db.groupMember.updateMany({
      where: { userId: contribution.userId, groupId: contribution.groupId },
      data: { totalContributed: { increment: contribution.netAmountCents }, lastPaymentAt: new Date() },
    });

    await db.group.update({
      where: { id: contribution.groupId },
      data: { totalValueMoved: { increment: contribution.netAmountCents } },
    });

    await sendWhatsApp(
      contribution.user.phone,
      `Payment confirmed!\n\n${formatCents(contribution.amountCents)} received for *${contribution.group.name}*.\nYour contribution is in the book.`
    );

    return reply.status(200).send("OK");
  });
}
