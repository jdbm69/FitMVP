"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const prisma_1 = require("./lib/prisma");
const port = Number(process.env.PORT ?? 3001);
const server = app_1.app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
});
const shutdown = async () => {
    await prisma_1.prisma.$disconnect();
    server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
