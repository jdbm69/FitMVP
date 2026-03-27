import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  assignMembershipTransactional,
  assertMemberExists,
  getActiveMembership,
} from "../services/membership-service";
import { ApiError } from "../types/api-error";
import {
  assignMembershipSchema,
  cancelMembershipSchema,
  createMemberSchema,
  memberAndMembershipParamsSchema,
  memberIdParamSchema,
} from "../validators/member-validators";

export async function createMember(req: Request, res: Response): Promise<void> {
  const payload = createMemberSchema.parse(req.body);

  const member = await prisma.member.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.toLowerCase(),
    },
  });

  res.status(201).json(member);
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const now = new Date();

  const members = await prisma.member.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (members.length === 0) {
    res.json([]);
    return;
  }

  const memberIds = members.map((m) => m.id);
  const activeRows = await prisma.membership.findMany({
    where: {
      memberId: { in: memberIds },
      startsAt: { lte: now },
      OR: [{ cancelledAt: null }, { cancelledAt: { gt: now } }],
    },
    select: { memberId: true },
  });
  const activeIds = new Set(activeRows.map((r) => r.memberId));

  res.json(
    members.map((m) => ({
      ...m,
      hasActiveMembership: activeIds.has(m.id),
    })),
  );
}

export async function getMemberSummary(req: Request, res: Response): Promise<void> {
  const { memberId } = memberIdParamSchema.parse(req.params);
  await assertMemberExists(memberId);

  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeMembership, lastCheckIn, recentCheckIns] = await Promise.all([
    prisma.membership.findFirst({
      where: {
        memberId,
        startsAt: { lte: now },
        OR: [{ cancelledAt: null }, { cancelledAt: { gt: now } }],
      },
      include: { plan: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.checkIn.findFirst({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkIn.count({
      where: {
        memberId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  res.json({
    memberId,
    activeMembership: activeMembership
      ? {
          membershipId: activeMembership.id,
          planId: activeMembership.planId,
          planName: activeMembership.plan.name,
          startsAt: activeMembership.startsAt,
          cancelledAt: activeMembership.cancelledAt,
        }
      : null,
    lastCheckInAt: lastCheckIn?.createdAt ?? null,
    checkInsLast30Days: recentCheckIns,
  });
}

export async function assignMembership(req: Request, res: Response): Promise<void> {
  const { memberId } = memberIdParamSchema.parse(req.params);
  await assertMemberExists(memberId);

  const payload = assignMembershipSchema.parse(req.body);
  const plan = await prisma.plan.findUnique({ where: { id: payload.planId } });
  if (!plan) {
    throw new ApiError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  const membership = await prisma.$transaction(
    async (tx) => assignMembershipTransactional(tx, memberId, payload.planId, payload.startsAt),
    { isolationLevel: "Serializable" },
  );

  res.status(201).json(membership);
}

export async function cancelMembership(req: Request, res: Response): Promise<void> {
  const { memberId, membershipId } = memberAndMembershipParamsSchema.parse(req.params);
  const payload = cancelMembershipSchema.parse(req.body);

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, memberId },
  });

  if (!membership) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
  }

  if (membership.cancelledAt) {
    throw new ApiError(409, "MEMBERSHIP_ALREADY_CANCELLED", "Membership is already cancelled");
  }

  if (payload.effectiveDate < membership.startsAt) {
    throw new ApiError(
      400,
      "INVALID_CANCELLATION_DATE",
      "Cancellation effective date cannot be before start date",
    );
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: { cancelledAt: payload.effectiveDate },
  });

  res.json(updated);
}

export async function createCheckIn(req: Request, res: Response): Promise<void> {
  const { memberId } = memberIdParamSchema.parse(req.params);
  await assertMemberExists(memberId);

  const activeMembership = await getActiveMembership(memberId);
  if (!activeMembership) {
    throw new ApiError(
      409,
      "ACTIVE_MEMBERSHIP_REQUIRED",
      "Only members with active memberships can check in",
    );
  }

  const checkIn = await prisma.checkIn.create({ data: { memberId } });
  res.status(201).json(checkIn);
}
