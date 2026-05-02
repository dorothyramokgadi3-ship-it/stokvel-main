import { sendWhatsApp } from "../utils/whatsapp-api";
import { db } from "@intuthuko/db";
import { formatCents } from "../utils/format";

interface IncomingMessage {
  from: string; name: string; type: string; text: string;
  imageId?: string; timestamp: string; messageId: string;
}

export async function handleMessage(msg: IncomingMessage) {
  const phone = msg.from.startsWith("+") ? msg.from : "+" + msg.from;

  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    user = await db.user.create({ data: { phone, displayName: msg.name || undefined } });
  }
  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date(), displayName: msg.name || user.displayName } });

  const cmd = msg.text.trim().toLowerCase();

  if (cmd.startsWith("/join ")) return handleJoin(user, phone, cmd.replace("/join ", "").trim().toUpperCase());
  if (cmd === "/balance") return handleBalance(user, phone);
  if (cmd === "/pay") return handlePay(user, phone);
  if (cmd === "/book") return handleBook(user, phone);
  if (cmd === "/circle") return handleCircle(user, phone);
  if (cmd === "/groups") return handleGroups(user, phone);
  if (cmd === "/help") return handleHelp(phone);
  if (msg.type === "image") return handleProof(phone);

  return sendWhatsApp(phone, "Sawubona! I'm Intuthuko.\n\n/join CODE - Join stokvel\n/balance - Check balance\n/pay - Make payment\n/book - View ledger\n/circle - Payout rotation\n/groups - Your stokvels\n/help - Get help\n\nSend a photo for payment proof.");
}

async function handleJoin(user: any, phone: string, code: string) {
  const group = await db.group.findUnique({ where: { code } });
  if (!group) return sendWhatsApp(phone, `Group *${code}* not found.`);

  const existing = await db.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });
  if (existing) return sendWhatsApp(phone, `You're already in *${group.name}*!`);

  const count = await db.groupMember.count({ where: { groupId: group.id, status: { in: ["ACTIVE", "LATE"] } } });
  if (count >= group.maxMembers) return sendWhatsApp(phone, `*${group.name}* is full.`);

  await db.groupMember.create({
    data: { userId: user.id, groupId: group.id, role: "MEMBER", status: "ACTIVE", sigWeight: 1 },
  });

  return sendWhatsApp(phone, `Welcome to *${group.name}*!\n\nMonthly: *${formatCents(group.monthlyAmount)}*\nPayout day: *${group.payoutDay}th*\nType: *${group.type}*\n\nType /pay to contribute.`);
}

async function handleBalance(user: any, phone: string) {
  const memberships = await db.groupMember.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "LATE"] } }, include: { group: true },
  });
  if (!memberships.length) return sendWhatsApp(phone, "No stokvels yet. /join CODE to join.");

  let msg = "Your Balances\n";
  for (const m of memberships) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const paid = await db.contribution.findFirst({
      where: { userId: user.id, groupId: m.groupId, forMonth: monthStart, status: "CONFIRMED" },
    });
    const pot = await db.contribution.aggregate({
      where: { groupId: m.groupId, status: "CONFIRMED" }, _sum: { netAmountCents: true },
    });
    msg += `\n*${m.group.name}* (${m.group.code})\n  Pot: *${formatCents(pot._sum.netAmountCents || 0)}*\n  You: *${formatCents(m.totalContributed)}*\n  This month: ${paid ? "Paid" : "Due"}\n`;
  }
  return sendWhatsApp(phone, msg);
}

async function handlePay(user: any, phone: string) {
  const m = await db.groupMember.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "LATE"] } }, include: { group: true },
  });
  if (!m) return sendWhatsApp(phone, "No stokvels. /join CODE first.");
  const g = m.group;
  const code = `INT-${g.code}-${Date.now().toString(36).toUpperCase()}`;

  return sendWhatsApp(phone, `Pay *${formatCents(g.monthlyAmount)}* to *${g.name}*\n\n1. *Instant EFT* - link coming soon\n2. *Retail* - Code: *${code}*\n3. *Bank Transfer* - Ref: ${g.bankReference || g.code}\n   Send proof photo after\n4. *Cash* - Ask secretary to record`);
}

async function handleBook(user: any, phone: string) {
  const m = await db.groupMember.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "LATE"] } }, include: { group: true },
  });
  if (!m) return sendWhatsApp(phone, "No stokvels. /join CODE first.");

  const entry = await db.ledgerEntry.findFirst({ where: { groupId: m.groupId }, orderBy: { date: "desc" } });
  if (!entry) return sendWhatsApp(phone, `*${m.group.name}* - No ledger entries yet. Book closes nightly at 8pm.`);

  return sendWhatsApp(phone, `*${m.group.name} - Ledger*\n\nDate: *${entry.date.toISOString().split("T")[0]}*\nIn: *${formatCents(entry.totalInCents)}*\nOut: *${formatCents(entry.totalOutCents)}*\nTx: *${entry.transactionCount}*\nHash: ${entry.dataHash.substring(0, 16)}...\nStatus: *${entry.status}*\n\nVerify: intuthuko.co.za/verify?hash=${entry.dataHash.substring(0, 12)}`);
}

async function handleCircle(user: any, phone: string) {
  const m = await db.groupMember.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "LATE"] } },
    include: { group: { include: { members: { where: { status: { in: ["ACTIVE", "LATE"] } }, orderBy: { rotationPosition: "asc" }, include: { user: { select: { displayName: true, phone: true } } } } } } },
  });
  if (!m) return sendWhatsApp(phone, "No stokvels. /join CODE first.");
  if (m.group.type !== "ROTATING") return sendWhatsApp(phone, `*${m.group.name}* is ${m.group.type} - no rotation.`);

  let msg = `*${m.group.name} - Circle*\n`;
  for (const mem of m.group.members) {
    const name = mem.user.displayName || mem.user.phone;
    const isNext = m.group.nextPayoutUserId === mem.userId;
    const isMe = mem.userId === user.id;
    msg += `\n${mem.rotationPosition || "?"}. ${name}${isNext ? " <- NEXT" : ""}${isMe ? " (you)" : ""}`;
  }
  if (m.group.nextPayoutDate) msg += `\n\nNext payout: *${m.group.nextPayoutDate.toISOString().split("T")[0]}*`;
  return sendWhatsApp(phone, msg);
}

async function handleGroups(user: any, phone: string) {
  const memberships = await db.groupMember.findMany({
    where: { userId: user.id, status: { not: "REMOVED" } }, include: { group: true },
  });
  if (!memberships.length) return sendWhatsApp(phone, "No stokvels. /join CODE to join.");
  let msg = "*Your Stokvels*\n";
  for (const m of memberships) msg += `\n- *${m.group.name}* (${m.group.code}) ${m.status}`;
  return sendWhatsApp(phone, msg);
}

async function handleHelp(phone: string) {
  return sendWhatsApp(phone, "*Intuthuko Help*\n\n/join CODE - Join stokvel\n/balance - Check balance\n/pay - Payment options\n/book - Public ledger\n/circle - Payout order\n/groups - Your stokvels\n\nSend photo for payment proof\n\n_Intuthuko - your stokvel, with a book no one can burn_");
}

async function handleProof(phone: string) {
  return sendWhatsApp(phone, "Proof received! Your secretary will verify it shortly.");
}
