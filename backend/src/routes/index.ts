import { Router } from "express";
import healthRouter from "./health-routes";
import memberRouter from "./member-routes";
import planRouter from "./plan-routes";

const router = Router();

router.use(healthRouter);
router.use(planRouter);
router.use(memberRouter);

export default router;
