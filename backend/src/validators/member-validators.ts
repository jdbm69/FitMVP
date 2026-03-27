import { z } from "zod";

export const createMemberSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export const assignMembershipSchema = z.object({
  planId: z.string().uuid(),
  startsAt: z.coerce.date(),
});

export const cancelMembershipSchema = z.object({
  effectiveDate: z.coerce.date(),
});

export const memberIdParamSchema = z.object({
  memberId: z.string().uuid(),
});

export const memberAndMembershipParamsSchema = z.object({
  memberId: z.string().uuid(),
  membershipId: z.string().uuid(),
});
