import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  console.log("Seeding Intuthuko...");

  const mamaNomsa = await db.user.upsert({ where: { phone: "+27821234567" }, update: {}, create: { phone: "+27821234567", displayName: "Mama Nomsa", language: "ZU", isVerified: true } });
  const khethiwe = await db.user.upsert({ where: { phone: "+27829876543" }, update: {}, create: { phone: "+27829876543", displayName: "Khethiwe", language: "ZU", isVerified: true } });
  const sipho = await db.user.upsert({ where: { phone: "+27831112222" }, update: {}, create: { phone: "+27831112222", displayName: "Sipho", language: "EN", isVerified: true } });
  const thandi = await db.user.upsert({ where: { phone: "+27842223333" }, update: {}, create: { phone: "+27842223333", displayName: "Thandi", language: "XH", isVerified: true } });
  console.log("  4 users");

  const masakhane = await db.group.upsert({ where: { code: "MAS123" }, update: {}, create: {
    code: "MAS123", name: "Masakhane Savings Club", description: "Est. 2019, Soweto. Monthly R500.",
    type: "ROTATING", monthlyAmount: 50000, payoutDay: 1, cycleLength: 12, maxMembers: 12,
    requiredSigners: 2, province: "GP", city: "Soweto",
    nextPayoutUserId: khethiwe.id, nextPayoutDate: new Date("2026-06-01"),
  }});
  console.log("  1 group: Masakhane");

  await db.groupMember.upsert({ where: { userId_groupId: { userId: mamaNomsa.id, groupId: masakhane.id } }, update: {}, create: { userId: mamaNomsa.id, groupId: masakhane.id, role: "CHAIR", rotationPosition: 1, status: "ACTIVE", sigWeight: 2, totalContributed: 250000 } });
  await db.groupMember.upsert({ where: { userId_groupId: { userId: khethiwe.id, groupId: masakhane.id } }, update: {}, create: { userId: khethiwe.id, groupId: masakhane.id, role: "TREASURER", rotationPosition: 2, status: "ACTIVE", sigWeight: 2, totalContributed: 250000 } });
  await db.groupMember.upsert({ where: { userId_groupId: { userId: sipho.id, groupId: masakhane.id } }, update: {}, create: { userId: sipho.id, groupId: masakhane.id, role: "SECRETARY", rotationPosition: 3, status: "ACTIVE", sigWeight: 1, totalContributed: 200000, missedPayments: 1 } });
  await db.groupMember.upsert({ where: { userId_groupId: { userId: thandi.id, groupId: masakhane.id } }, update: {}, create: { userId: thandi.id, groupId: masakhane.id, role: "MEMBER", rotationPosition: 4, status: "ACTIVE", sigWeight: 1, totalContributed: 250000 } });
  console.log("  4 members");

  const rules = [
    { key: "late_fee", value: "5000", label: "Late Payment Fee", description: "R50 if 7+ days late", enforced: true },
    { key: "max_missed", value: "3", label: "Max Missed Payments", description: "Auto-suspend after 3", enforced: true },
    { key: "meeting_quorum", value: "0.75", label: "Meeting Quorum", description: "75% attendance", enforced: false },
  ];
  for (const r of rules) await db.rule.upsert({ where: { groupId_key: { groupId: masakhane.id, key: r.key } }, update: {}, create: { groupId: masakhane.id, ...r } });
  console.log("  3 rules");

  const may = new Date("2026-05-01");
  for (const u of [mamaNomsa, khethiwe, thandi]) {
    await db.contribution.create({ data: {
      groupId: masakhane.id, userId: u.id, amountCents: 50000, feeAmountCents: 0, netAmountCents: 50000,
      forMonth: may, forCycle: 1, method: "OZOW", reference: `OZOW-${u.phone}-MAY`, status: "CONFIRMED", confirmedAt: new Date(),
    }});
  }
  console.log("  3 contributions (May)");
  console.log("\nDone! Masakhane is ready.");
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
