const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create users over the last 7 days
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(now);
    date.setDate(now.getDate() - daysAgo);
    
    await prisma.user.create({
      data: {
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        password: 'hashedpassword',
        role: 'USER',
        createdAt: date
      }
    });
  }

  // Create products to buy
  const product = await prisma.product.create({
    data: {
      name: 'Sample Product',
      slug: 'sample-product-' + Date.now(),
      price: 150000,
      stock: 100,
      isActive: true
    }
  });

  // Create orders over the last 6 months
  const users = await prisma.user.findMany({ take: 5 });
  for (let i = 0; i < 40; i++) {
    const monthsAgo = Math.floor(Math.random() * 6);
    const date = new Date(now);
    date.setMonth(now.getMonth() - monthsAgo);
    
    await prisma.order.create({
      data: {
        userId: users[Math.floor(Math.random() * users.length)].id,
        orderNumber: 'ORD-' + Math.floor(Math.random() * 1000000),
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        itemsPrice: 150000,
        totalPrice: 150000 * (Math.floor(Math.random() * 3) + 1),
        createdAt: date
      }
    });
  }
  
  console.log("Seeded database with stats data!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
