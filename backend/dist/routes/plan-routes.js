"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plans_controller_1 = require("../controllers/plans-controller");
const planRouter = (0, express_1.Router)();
planRouter.get("/plans", plans_controller_1.listPlans);
exports.default = planRouter;
