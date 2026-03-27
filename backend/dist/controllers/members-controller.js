"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMember = createMember;
exports.listMembers = listMembers;
exports.getMemberSummary = getMemberSummary;
exports.assignMembership = assignMembership;
exports.cancelMembership = cancelMembership;
exports.createCheckIn = createCheckIn;
const prisma_1 = require("../lib/prisma");
const membership_service_1 = require("../services/membership-service");
const api_error_1 = require("../types/api-error");
const member_validators_1 = require("../validators/member-validators");
async function createMember(req, res) {
    const payload = member_validators_1.createMemberSchema.parse(req.body);
    const member = await prisma_1.prisma.member.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email.toLowerCase(),
        },
    });
    res.status(201).json(member);
}
async function listMembers(req, res) {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const members = await prisma_1.prisma.member.findMany({
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
    res.json(members);
}
async function getMemberSummary(req, res) {
    const { memberId } = member_validators_1.memberIdParamSchema.parse(req.params);
    await (0, membership_service_1.assertMemberExists)(memberId);
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [activeMembership, lastCheckIn, recentCheckIns] = await Promise.all([
        prisma_1.prisma.membership.findFirst({
            where: {
                memberId,
                startsAt: { lte: now },
                OR: [{ cancelledAt: null }, { cancelledAt: { gt: now } }],
            },
            include: { plan: true },
            orderBy: { startsAt: "desc" },
        }),
        prisma_1.prisma.checkIn.findFirst({
            where: { memberId },
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.prisma.checkIn.count({
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
async function assignMembership(req, res) {
    const { memberId } = member_validators_1.memberIdParamSchema.parse(req.params);
    await (0, membership_service_1.assertMemberExists)(memberId);
    const payload = member_validators_1.assignMembershipSchema.parse(req.body);
    const plan = await prisma_1.prisma.plan.findUnique({ where: { id: payload.planId } });
    if (!plan) {
        throw new api_error_1.ApiError(404, "PLAN_NOT_FOUND", "Plan not found");
    }
    const membership = await prisma_1.prisma.$transaction(async (tx) => (0, membership_service_1.assignMembershipTransactional)(tx, memberId, payload.planId, payload.startsAt), { isolationLevel: "Serializable" });
    res.status(201).json(membership);
}
async function cancelMembership(req, res) {
    const { memberId, membershipId } = member_validators_1.memberAndMembershipParamsSchema.parse(req.params);
    const payload = member_validators_1.cancelMembershipSchema.parse(req.body);
    const membership = await prisma_1.prisma.membership.findFirst({
        where: { id: membershipId, memberId },
    });
    if (!membership) {
        throw new api_error_1.ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
    }
    if (membership.cancelledAt) {
        throw new api_error_1.ApiError(409, "MEMBERSHIP_ALREADY_CANCELLED", "Membership is already cancelled");
    }
    if (payload.effectiveDate < membership.startsAt) {
        throw new api_error_1.ApiError(400, "INVALID_CANCELLATION_DATE", "Cancellation effective date cannot be before start date");
    }
    const updated = await prisma_1.prisma.membership.update({
        where: { id: membership.id },
        data: { cancelledAt: payload.effectiveDate },
    });
    res.json(updated);
}
async function createCheckIn(req, res) {
    const { memberId } = member_validators_1.memberIdParamSchema.parse(req.params);
    await (0, membership_service_1.assertMemberExists)(memberId);
    const activeMembership = await (0, membership_service_1.getActiveMembership)(memberId);
    if (!activeMembership) {
        throw new api_error_1.ApiError(409, "ACTIVE_MEMBERSHIP_REQUIRED", "Only members with active memberships can check in");
    }
    const checkIn = await prisma_1.prisma.checkIn.create({ data: { memberId } });
    res.status(201).json(checkIn);
}
