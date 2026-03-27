import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 3001);

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
