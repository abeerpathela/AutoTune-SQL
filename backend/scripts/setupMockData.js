const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

const BATCH_SIZE = 1000;

async function setupMockData() {
  console.log('🚀 Starting mock data setup...');

  // Drop existing tables if needed (uncomment to reset)
  // console.log('⚠️ Dropping existing tables...');
  // await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS orders;');
  // await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS products;');
  // await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS users;');

  // Create tables
  console.log('📊 Creating tables...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      age INT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price NUMERIC(10, 2),
      category VARCHAR(100),
      description TEXT
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      status VARCHAR(50),
      amount NUMERIC(10, 2),
      order_date TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
  
  // Create indexes (ONLY PKs, not email/status/category!)
  console.log('📇 Creating indexes...');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);');

  // Seed users (20,000 rows)
  console.log('👥 Seeding 20,000 users...');
  for (let i = 0; i < 20000; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < Math.min(BATCH_SIZE, 20000 - i); j++) {
      batch.push({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        age: faker.number.int({ min: 18, max: 80 }),
        bio: faker.lorem.paragraph()
      });
    }
    const values = batch.map(u => 
      `('${u.username.replace(/'/g, "''")}', '${u.email.replace(/'/g, "''")}', ${u.age}, '${u.bio.replace(/'/g, "''")}')`
    ).join(',');
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (username, email, age, bio) VALUES ${values};
    `);
    if ((i + BATCH_SIZE) % 5000 === 0) {
      console.log(`   - ${Math.min(i + BATCH_SIZE, 20000)} users seeded...`);
    }
  }
  
  // Seed products (5,000 rows)
  console.log('📦 Seeding 5,000 products...');
  for (let i = 0; i < 5000; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < Math.min(BATCH_SIZE, 5000 - i); j++) {
      batch.push({
        name: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price()),
        category: faker.commerce.department(),
        description: faker.commerce.productDescription()
      });
    }
    const values = batch.map(p => 
      `('${p.name.replace(/'/g, "''")}', ${p.price}, '${p.category.replace(/'/g, "''")}', '${p.description.replace(/'/g, "''")}')`
    ).join(',');
    await prisma.$executeRawUnsafe(`
      INSERT INTO products (name, price, category, description) VALUES ${values};
    `);
    if ((i + BATCH_SIZE) % 2500 === 0) {
      console.log(`   - ${Math.min(i + BATCH_SIZE, 5000)} products seeded...`);
    }
  }
  
  // Seed orders (50,000 rows)
  console.log('🛒 Seeding 50,000 orders...');
  for (let i = 0; i < 50000; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < Math.min(BATCH_SIZE, 50000 - i); j++) {
      const productPrice = parseFloat(faker.commerce.price());
      const quantity = faker.number.int({ min: 1, max: 10 });
      batch.push({
        user_id: faker.number.int({ min: 1, max: 20000 }),
        product_id: faker.number.int({ min: 1, max: 5000 }),
        status: faker.helpers.arrayElement(['pending', 'shipped', 'delivered', 'cancelled']),
        amount: productPrice * quantity,
        order_date: faker.date.past({ years: 2 })
      });
    }
    const values = batch.map(o => 
      `(${o.user_id}, ${o.product_id}, '${o.status}', ${o.amount}, '${o.order_date.toISOString()}')`
    ).join(',');
    await prisma.$executeRawUnsafe(`
      INSERT INTO orders (user_id, product_id, status, amount, order_date) VALUES ${values};
    `);
    if ((i + BATCH_SIZE) % 10000 === 0) {
      console.log(`   - ${Math.min(i + BATCH_SIZE, 50000)} orders seeded...`);
    }
  }

  console.log('🎉 Mock data setup complete!');
  await prisma.$disconnect();
}

setupMockData().catch(async (error) => {
  console.error('❌ Error in mock data setup:', error);
  await prisma.$disconnect();
  process.exit(1);
});
