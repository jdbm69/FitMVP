"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health-routes"));
const member_routes_1 = __importDefault(require("./member-routes"));
const plan_routes_1 = __importDefault(require("./plan-routes"));
const router = (0, express_1.Router)();
router.use(health_routes_1.default);
router.use(plan_routes_1.default);
router.use(member_routes_1.default);
exports.default = router;
