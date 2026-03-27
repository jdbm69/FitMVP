"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlans = listPlans;
const prisma_1 = require("../lib/prisma");
async function listPlans(_req, res) {
    const plans = await prisma_1.prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
    res.json(plans);
}
