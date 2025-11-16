import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the user email from environment variable
  const userEmail = process.env.USER1_EMAIL || 'taisei.matsuura.0315@gmail.com';

  console.log(`🌱 Seeding database for user: ${userEmail}`);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log('❌ User not found. Please login first to create a user account.');
    return;
  }

  console.log(`✅ Found user: ${user.email}`);

  // Delete existing test data
  console.log('🗑️  Cleaning up existing data...');
  await prisma.transaction.deleteMany({
    where: { userId: user.id },
  });
  await prisma.category.deleteMany({
    where: { userId: user.id },
  });
  await prisma.paymentMethod.deleteMany({
    where: { userId: user.id },
  });

  // Create income categories
  console.log('📝 Creating income categories...');
  const incomeCategories = await Promise.all([
    prisma.category.create({
      data: {
        userId: user.id,
        name: '給与',
        type: 'INCOME',
        color: '#3b82f6',
        sortOrder: 1,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '賞与',
        type: 'INCOME',
        color: '#10b981',
        sortOrder: 2,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '副業',
        type: 'INCOME',
        color: '#8b5cf6',
        sortOrder: 3,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '投資',
        type: 'INCOME',
        color: '#f59e0b',
        sortOrder: 4,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'その他',
        type: 'INCOME',
        color: '#6b7280',
        sortOrder: 5,
        isDefault: true,
      },
    }),
  ]);

  // Create expense categories
  console.log('📝 Creating expense categories...');
  const expenseCategories = await Promise.all([
    prisma.category.create({
      data: {
        userId: user.id,
        name: '食費',
        type: 'EXPENSE',
        color: '#ef4444',
        sortOrder: 1,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '住居費',
        type: 'EXPENSE',
        color: '#f97316',
        sortOrder: 2,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '光熱費',
        type: 'EXPENSE',
        color: '#eab308',
        sortOrder: 3,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '通信費',
        type: 'EXPENSE',
        color: '#06b6d4',
        sortOrder: 4,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '交通費',
        type: 'EXPENSE',
        color: '#8b5cf6',
        sortOrder: 5,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '娯楽費',
        type: 'EXPENSE',
        color: '#ec4899',
        sortOrder: 6,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '医療費',
        type: 'EXPENSE',
        color: '#14b8a6',
        sortOrder: 7,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '教育費',
        type: 'EXPENSE',
        color: '#3b82f6',
        sortOrder: 8,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: '衣服費',
        type: 'EXPENSE',
        color: '#a855f7',
        sortOrder: 9,
        isDefault: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'その他',
        type: 'EXPENSE',
        color: '#6b7280',
        sortOrder: 10,
        isDefault: true,
      },
    }),
  ]);

  // Create payment methods
  console.log('💳 Creating payment methods...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: '現金',
        type: 'CASH',
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: 'クレジットカード',
        type: 'CREDIT',
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: 'デビットカード',
        type: 'DEBIT',
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: '電子マネー',
        type: 'EMONEY',
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId: user.id,
        name: '銀行振込',
        type: 'BANK',
      },
    }),
  ]);

  // Create test income transactions
  console.log('💰 Creating test income transactions...');
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  await Promise.all([
    // This month
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: incomeCategories[0].id, // 給与
        type: 'INCOME',
        amount: 350000,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 25),
        description: '11月分給与',
        vendor: '株式会社サンプル',
      },
    }),
    // Last month
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: incomeCategories[0].id, // 給与
        type: 'INCOME',
        amount: 350000,
        transactionDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 25),
        description: '10月分給与',
        vendor: '株式会社サンプル',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: incomeCategories[2].id, // 副業
        type: 'INCOME',
        amount: 50000,
        transactionDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15),
        description: 'フリーランス案件',
        vendor: 'クライアントA',
      },
    }),
    // Two months ago
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: incomeCategories[0].id, // 給与
        type: 'INCOME',
        amount: 350000,
        transactionDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 25),
        description: '9月分給与',
        vendor: '株式会社サンプル',
      },
    }),
  ]);

  // Create test expense transactions
  console.log('💸 Creating test expense transactions...');
  await Promise.all([
    // This month - 食費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[0].id,
        paymentMethodId: paymentMethods[1].id,
        type: 'EXPENSE',
        amount: 8500,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
        description: 'スーパーマーケットでの買い物',
        vendor: 'スーパーABC',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[0].id,
        paymentMethodId: paymentMethods[0].id,
        type: 'EXPENSE',
        amount: 3200,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
        description: 'ランチ',
        vendor: 'レストランXYZ',
      },
    }),
    // This month - 住居費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[1].id,
        paymentMethodId: paymentMethods[4].id,
        type: 'EXPENSE',
        amount: 80000,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
        description: '家賃',
        vendor: '不動産管理会社',
      },
    }),
    // This month - 光熱費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[2].id,
        paymentMethodId: paymentMethods[4].id,
        type: 'EXPENSE',
        amount: 12000,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 10),
        description: '電気・ガス料金',
        vendor: '電力会社',
      },
    }),
    // This month - 通信費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[3].id,
        paymentMethodId: paymentMethods[1].id,
        type: 'EXPENSE',
        amount: 8000,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
        description: '携帯電話料金',
        vendor: 'モバイルキャリア',
      },
    }),
    // This month - 娯楽費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[5].id,
        paymentMethodId: paymentMethods[1].id,
        type: 'EXPENSE',
        amount: 15000,
        transactionDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 12),
        description: '映画・外食',
        vendor: 'エンターテイメント施設',
      },
    }),
    // Last month - 食費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[0].id,
        paymentMethodId: paymentMethods[1].id,
        type: 'EXPENSE',
        amount: 45000,
        transactionDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15),
        description: '月間食費',
        vendor: '各種スーパー',
      },
    }),
    // Last month - 交通費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[4].id,
        paymentMethodId: paymentMethods[3].id,
        type: 'EXPENSE',
        amount: 10000,
        transactionDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        description: '定期券',
        vendor: '鉄道会社',
      },
    }),
    // Two months ago - 医療費
    prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: expenseCategories[6].id,
        paymentMethodId: paymentMethods[0].id,
        type: 'EXPENSE',
        amount: 5000,
        transactionDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 10),
        description: '健康診断',
        vendor: 'クリニックABC',
      },
    }),
  ]);

  console.log('✅ Seeding completed successfully!');
  console.log(`
📊 Summary:
- Income categories: ${incomeCategories.length}
- Expense categories: ${expenseCategories.length}
- Payment methods: ${paymentMethods.length}
- Income transactions: 4
- Expense transactions: 9
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
