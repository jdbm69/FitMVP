import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function listPlans(_req: Request, res: Response): Promise<void> {
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
  res.json(plans);
}
