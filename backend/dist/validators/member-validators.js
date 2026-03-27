"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberAndMembershipParamsSchema = exports.memberIdParamSchema = exports.cancelMembershipSchema = exports.assignMembershipSchema = exports.createMemberSchema = void 0;
const zod_1 = require("zod");
exports.createMemberSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1),
    lastName: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().email(),
});
exports.assignMembershipSchema = zod_1.z.object({
    planId: zod_1.z.string().uuid(),
    startsAt: zod_1.z.coerce.date(),
});
exports.cancelMembershipSchema = zod_1.z.object({
    effectiveDate: zod_1.z.coerce.date(),
});
exports.memberIdParamSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid(),
});
exports.memberAndMembershipParamsSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid(),
    membershipId: zod_1.z.string().uuid(),
});
