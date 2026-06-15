const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up seeded test data...");

  // Find all test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@example.com'
      }
    }
  });

  const testUserIds = testUsers.map(u => u.id);

  // Delete orders belonging to test users
  const ordersResult = await prisma.order.deleteMany({
    where: {
      userId: {
        in: testUserIds
      }
    }
  });
  console.log(`Deleted ${ordersResult.count} test orders.`);

  // Delete test users
  const usersResult = await prisma.user.deleteMany({
    where: {
      id: {
        in: testUserIds
      }
    }
  });
  console.log(`Deleted ${usersResult.count} test users.`);

  // Delete sample products created by seed
  const productsResult = await prisma.product.deleteMany({
    where: {
      name: 'Sample Product'
    }
  });
  console.log(`Deleted ${productsResult.count} sample products.`);

  console.log("Database clean up complete! Only admin accounts and your real data remain.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
