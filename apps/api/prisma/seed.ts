import { PrismaClient, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@acquisitionconcierge.ch' },
    update: {},
    create: {
      email: 'demo@acquisitionconcierge.ch',
      name: 'Demo User'
    }
  });

  const existing = await prisma.sourcingRequest.findFirst({
    where: { userId: user.id }
  });

  if (!existing) {
    const request = await prisma.sourcingRequest.create({
      data: {
        userId: user.id,
        budgetChf: 1200,
        specs: 'Need a refurbished mirrorless camera with 4K support and one lens included.',
        category: 'ELECTRONICS',
        condition: 'USED',
        country: 'CH',
        urgency: 'STANDARD',
        sourcingFeeChf: 120,
        status: RequestStatus.FEE_PENDING
      }
    });

    await prisma.requestStatusEvent.create({
      data: {
        requestId: request.id,
        toStatus: RequestStatus.FEE_PENDING,
        reason: 'Seeded demo request'
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
