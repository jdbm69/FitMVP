import { Router } from "express";
import {
  assignMembership,
  cancelMembership,
  createCheckIn,
  createMember,
  getMemberSummary,
  listMembers,
} from "../controllers/members-controller";

const memberRouter = Router();

memberRouter.post("/members", createMember);
memberRouter.get("/members", listMembers);
memberRouter.get("/members/:memberId/summary", getMemberSummary);
memberRouter.post("/members/:memberId/memberships", assignMembership);
memberRouter.post("/members/:memberId/memberships/:membershipId/cancel", cancelMembership);
memberRouter.post("/members/:memberId/check-ins", createCheckIn);

export default memberRouter;
