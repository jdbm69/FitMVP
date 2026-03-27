"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertMemberExists = assertMemberExists;
exports.getActiveMembership = getActiveMembership;
exports.assignMembershipTransactional = assignMembershipTransactional;
const prisma_1 = require("../lib/prisma");
const api_error_1 = require("../types/api-error");
async function assertMemberExists(memberId) {
    const member = await prisma_1.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
        throw new api_error_1.ApiError(404, "MEMBER_NOT_FOUND", "Member not found");
    }
}
async function getActiveMembership(memberId) {
    const now = new Date();
    return prisma_1.prisma.membership.findFirst({
        where: {
            memberId,
            startsAt: { lte: now },
            OR: [{ cancelledAt: null }, { cancelledAt: { gt: now } }],
        },
        orderBy: { startsAt: "desc" },
    });
}
async function assignMembershipTransactional(tx, memberId, planId, startsAt) {
    await tx.$queryRaw `SELECT id FROM "Member" WHERE id = ${memberId} FOR UPDATE`;
    const overlapping = await tx.membership.findFirst({
        where: {
            memberId,
            startsAt: { lte: startsAt },
            OR: [{ cancelledAt: null }, { cancelledAt: { gt: startsAt } }],
        },
    });
    if (overlapping) {
        throw new api_error_1.ApiError(409, "ACTIVE_MEMBERSHIP_CONFLICT", "Member already has an active membership for that start date");
    }
    return tx.membership.create({
        data: {
            memberId,
            planId,
            startsAt,
        },
    });
}
