const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { name: "Basic Monthly" },
    update: {},
    create: {
      name: "Basic Monthly",
      priceCents: 3999,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
