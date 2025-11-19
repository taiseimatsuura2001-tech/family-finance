import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// カテゴリーと支払い方法の定義
const incomeCategoryData = [
  { name: '給与', color: '#3b82f6', sortOrder: 1 },
  { name: '賞与', color: '#10b981', sortOrder: 2 },
  { name: '副業', color: '#8b5cf6', sortOrder: 3 },
  { name: '投資', color: '#f59e0b', sortOrder: 4 },
  { name: 'その他', color: '#6b7280', sortOrder: 5 },
];

const expenseCategoryData = [
  { name: '食費', color: '#ef4444', sortOrder: 1 },
  { name: '住居費', color: '#f97316', sortOrder: 2 },
  { name: '光熱費', color: '#eab308', sortOrder: 3 },
  { name: '通信費', color: '#06b6d4', sortOrder: 4 },
  { name: '交通費', color: '#8b5cf6', sortOrder: 5 },
  { name: '娯楽費', color: '#ec4899', sortOrder: 6 },
  { name: '医療費', color: '#14b8a6', sortOrder: 7 },
  { name: '教育費', color: '#3b82f6', sortOrder: 8 },
  { name: '衣服費', color: '#a855f7', sortOrder: 9 },
  { name: 'その他', color: '#6b7280', sortOrder: 10 },
];

const paymentMethodData = [
  { name: '現金', type: 'CASH' },
  { name: 'クレジットカード', type: 'CREDIT' },
  { name: 'デビットカード', type: 'DEBIT' },
  { name: '電子マネー', type: 'EMONEY' },
  { name: '銀行振込', type: 'BANK' },
];

// ユーザーにカテゴリーと支払い方法を作成する関数
async function createCategoriesForUser(userId: string, userEmail: string) {
  console.log(`\n📝 Creating categories for user: ${userEmail}`);

  // 既存データを削除
  await prisma.category.deleteMany({
    where: { userId },
  });
  await prisma.paymentMethod.deleteMany({
    where: { userId },
  });

  // 収入カテゴリーを作成
  const incomeCategories = await Promise.all(
    incomeCategoryData.map((cat) =>
      prisma.category.create({
        data: {
          userId,
          name: cat.name,
          type: 'INCOME',
          color: cat.color,
          sortOrder: cat.sortOrder,
          isDefault: true,
        },
      })
    )
  );

  // 支出カテゴリーを作成
  const expenseCategories = await Promise.all(
    expenseCategoryData.map((cat) =>
      prisma.category.create({
        data: {
          userId,
          name: cat.name,
          type: 'EXPENSE',
          color: cat.color,
          sortOrder: cat.sortOrder,
          isDefault: true,
        },
      })
    )
  );

  // 支払い方法を作成
  const paymentMethods = await Promise.all(
    paymentMethodData.map((pm) =>
      prisma.paymentMethod.create({
        data: {
          userId,
          name: pm.name,
          type: pm.type as any,
        },
      })
    )
  );

  console.log(`  ✅ Income categories: ${incomeCategories.length}`);
  console.log(`  ✅ Expense categories: ${expenseCategories.length}`);
  console.log(`  ✅ Payment methods: ${paymentMethods.length}`);

  return { incomeCategories, expenseCategories, paymentMethods };
}

async function main() {
  // Get user emails from environment variables
  const user1Email = process.env.USER1_EMAIL;
  const user2Email = process.env.USER2_EMAIL;

  console.log('🌱 Seeding database for all users...\n');

  // Process User 1
  if (user1Email) {
    const user1 = await prisma.user.findUnique({
      where: { email: user1Email },
    });

    if (user1) {
      console.log(`✅ Found user 1: ${user1.email}`);
      await createCategoriesForUser(user1.id, user1.email);
    } else {
      console.log(`❌ User 1 not found (${user1Email}). Please login first.`);
    }
  } else {
    console.log('⚠️  USER1_EMAIL not set in environment variables');
  }

  // Process User 2
  if (user2Email) {
    const user2 = await prisma.user.findUnique({
      where: { email: user2Email },
    });

    if (user2) {
      console.log(`✅ Found user 2: ${user2.email}`);
      await createCategoriesForUser(user2.id, user2.email);
    } else {
      console.log(`❌ User 2 not found (${user2Email}). Please login first.`);
    }
  } else {
    console.log('⚠️  USER2_EMAIL not set in environment variables');
  }

  console.log('\n✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
