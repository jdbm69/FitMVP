import { prisma } from "../src/lib/prisma";

beforeEach(async () => {
  await prisma.checkIn.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.member.deleteMany();
  await prisma.plan.deleteMany();

  await prisma.plan.create({
    data: {
      name: "Basic Monthly",
      priceCents: 3999,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
