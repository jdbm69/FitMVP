import { Prisma, Membership } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../types/api-error";

export async function assertMemberExists(memberId: string): Promise<void> {
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new ApiError(404, "MEMBER_NOT_FOUND", "Member not found");
  }
}

export async function getActiveMembership(memberId: string): Promise<Membership | null> {
  const now = new Date();
  return prisma.membership.findFirst({
    where: {
      memberId,
      startsAt: { lte: now },
      OR: [{ cancelledAt: null }, { cancelledAt: { gt: now } }],
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function assignMembershipTransactional(
  tx: Prisma.TransactionClient,
  memberId: string,
  planId: string,
  startsAt: Date,
): Promise<Membership> {
  await tx.$queryRaw`SELECT id FROM "Member" WHERE id = ${memberId} FOR UPDATE`;

  const overlapping = await tx.membership.findFirst({
    where: {
      memberId,
      startsAt: { lte: startsAt },
      OR: [{ cancelledAt: null }, { cancelledAt: { gt: startsAt } }],
    },
  });

  if (overlapping) {
    throw new ApiError(
      409,
      "ACTIVE_MEMBERSHIP_CONFLICT",
      "Member already has an active membership for that start date",
    );
  }

  return tx.membership.create({
    data: {
      memberId,
      planId,
      startsAt,
    },
  });
}
