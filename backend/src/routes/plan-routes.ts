import { Router } from "express";
import { listPlans } from "../controllers/plans-controller";

const planRouter = Router();

planRouter.get("/plans", listPlans);

export default planRouter;
