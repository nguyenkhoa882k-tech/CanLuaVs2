import { open } from 'react-native-nitro-sqlite';

const DB_NAME = 'canlua.db';

let db: any = null;

export const initDatabase = async () => {
  try {
    // If already initialized, return existing connection
    if (db) {
      console.log('Database already initialized');
      return db;
    }

    db = await open({ name: DB_NAME });

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS buyers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sellers (
        id TEXT PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        date TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,vậy
        subtract_weight REAL DEFAULT 0,
        actual_weight REAL DEFAULT 0,
        price_per_kg REAL NOT NULL,
        deposit REAL DEFAULT 0,
        paid REAL DEFAULT 0,
        bag_data TEXT,
        total_bags INTEGER DEFAULT 0,
        total_weight REAL DEFAULT 0,
        date TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (seller_id) REFERENCES sellers (id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create custom categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS custom_categories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Migration: Add total_bags and total_weight columns if they don't exist
    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN total_bags INTEGER DEFAULT 0',
      );
      console.log('Added total_bags column');
    } catch {
      // Column already exists, ignore
    }

    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN total_weight REAL DEFAULT 0',
      );
      console.log('Added total_weight column');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Add tare_mode and tare_bags_per_kg columns
    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN tare_mode TEXT DEFAULT "auto"',
      );
      console.log('Added tare_mode column');
    } catch {
      // Column already exists, ignore
    }

    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN tare_bags_per_kg REAL DEFAULT 8',
      );
      console.log('Added tare_bags_per_kg column');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Add is_deleted column
    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN is_deleted INTEGER DEFAULT 0',
      );
      console.log('Added is_deleted column');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Add input_digits and input_format columns
    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN input_digits INTEGER DEFAULT 3',
      );
      console.log('Added input_digits column');
    } catch {
      // Column already exists, ignore
    }

    try {
      await db.execute(
        'ALTER TABLE transactions ADD COLUMN input_format TEXT DEFAULT "odd"',
      );
      console.log('Added input_format column');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Add is_deleted column to buyers
    try {
      await db.execute(
        'ALTER TABLE buyers ADD COLUMN is_deleted INTEGER DEFAULT 0',
      );
      console.log('Added is_deleted column to buyers');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Add is_deleted column to sellers
    try {
      await db.execute(
        'ALTER TABLE sellers ADD COLUMN is_deleted INTEGER DEFAULT 0',
      );
      console.log('Added is_deleted column to sellers');
    } catch {
      // Column already exists, ignore
    }

    // Migration: Update existing transactions without input_digits/input_format to use default (3 số lẻ)
    try {
      const result = await db.execute(
        'SELECT id, input_digits, input_format FROM transactions WHERE input_digits IS NULL OR input_format IS NULL',
      );
      const transactionsToUpdate = result.rows?._array || [];
      
      if (transactionsToUpdate.length > 0) {
        console.log(`Updating ${transactionsToUpdate.length} transactions with default input format (3 số lẻ)...`);
        
        for (const transaction of transactionsToUpdate) {
          await db.execute(
            'UPDATE transactions SET input_digits = 3, input_format = "odd" WHERE id = ?',
            [transaction.id],
          );
        }
        
        console.log('Migration completed: All transactions now have input format');
      }
    } catch (error) {
      console.log('Migration for input format already completed or error:', error);
    }

    // Migration: Recalculate total_bags and total_weight for existing transactions
    try {
      const result = await db.execute(
        'SELECT id, bag_data FROM transactions WHERE bag_data IS NOT NULL AND (total_bags = 0 OR total_weight = 0)',
      );
      const transactions = result.rows?._array || [];

      console.log('Migrating', transactions.length, 'transactions...');

      for (const transaction of transactions) {
        if (transaction.bag_data) {
          try {
            const tables = JSON.parse(transaction.bag_data);
            let totalBags = 0;
            let totalWeight = 0;

            tables.forEach((table: any) => {
              table.rows.forEach((row: any) => {
                ['a', 'b', 'c', 'd', 'e'].forEach((col: string) => {
                  const inputValue = row[col] || '0';
                  const numValue = parseFloat(inputValue);

                  if (numValue > 0) {
                    totalBags++;
                    const actualValue = numValue / 10;
                    totalWeight += actualValue;
                  }
                });
              });
            });

            await db.execute(
              'UPDATE transactions SET total_bags = ?, total_weight = ? WHERE id = ?',
              [totalBags, totalWeight, transaction.id],
            );
          } catch (error) {
            console.error(
              'Error migrating transaction:',
              transaction.id,
              error,
            );
          }
        }
      }

      console.log('Migration completed!');
    } catch (error) {
      console.error('Migration error:', error);
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = async () => {
  if (!db) {
    console.log('Database not initialized, initializing now...');
    await initDatabase();
  }
  return db;
};

// Buyer operations
export const addBuyer = async (buyer: {
  id: string;
  name: string;
  phone: string;
}) => {
  const database = await getDatabase();
  await database.execute(
    'INSERT INTO buyers (id, name, phone) VALUES (?, ?, ?)',
    [buyer.id, buyer.name, buyer.phone],
  );
};

export const getAllBuyers = async () => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM buyers WHERE is_deleted = 0 ORDER BY created_at DESC',
  );
  // Map snake_case to camelCase
  const buyers = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
  }));
  return buyers;
};

export const deleteBuyer = async (id: string) => {
  const database = await getDatabase();
  // Soft delete - set is_deleted to 1
  await database.execute('UPDATE buyers SET is_deleted = 1 WHERE id = ?', [id]);
};

export const restoreBuyer = async (id: string) => {
  const database = await getDatabase();
  await database.execute('UPDATE buyers SET is_deleted = 0 WHERE id = ?', [id]);
};

export const getDeletedBuyers = async () => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM buyers WHERE is_deleted = 1 ORDER BY created_at DESC',
  );
  const buyers = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
  }));
  return buyers;
};

// Seller operations
export const addSeller = async (seller: {
  id: string;
  buyerId: string;
  name: string;
  price: number;
  date: string;
}) => {
  const database = await getDatabase();
  await database.execute(
    'INSERT INTO sellers (id, buyer_id, name, price, date) VALUES (?, ?, ?, ?, ?)',
    [seller.id, seller.buyerId, seller.name, seller.price, seller.date],
  );
};

export const getSellersByBuyerId = async (buyerId: string) => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM sellers WHERE buyer_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
    [buyerId],
  );
  // Map snake_case to camelCase
  const sellers = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    buyerId: row.buyer_id,
    name: row.name,
    price: row.price,
    date: row.date,
    createdAt: row.created_at,
  }));
  return sellers;
};

export const deleteSeller = async (id: string) => {
  const database = await getDatabase();
  // Soft delete - set is_deleted to 1
  await database.execute('UPDATE sellers SET is_deleted = 1 WHERE id = ?', [id]);
};

export const restoreSeller = async (id: string) => {
  const database = await getDatabase();
  await database.execute('UPDATE sellers SET is_deleted = 0 WHERE id = ?', [id]);
};

export const getDeletedSellers = async (buyerId: string) => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM sellers WHERE buyer_id = ? AND is_deleted = 1 ORDER BY created_at DESC',
    [buyerId],
  );
  const sellers = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    buyerId: row.buyer_id,
    name: row.name,
    price: row.price,
    date: row.date,
    createdAt: row.created_at,
  }));
  return sellers;
};

// Transaction operations
export const addTransaction = async (transaction: {
  id: string;
  sellerId: string;
  subtractWeight: number;
  actualWeight: number;
  pricePerKg: number;
  deposit: number;
  paid: number;
  bagData: string;
  totalBags: number;
  totalWeight: number;
  date: string;
  inputDigits?: number;
  inputFormat?: string;
}) => {
  const database = await getDatabase();
  await database.execute(
    'INSERT INTO transactions (id, seller_id, subtract_weight, actual_weight, price_per_kg, deposit, paid, bag_data, total_bags, total_weight, date, input_digits, input_format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      transaction.id,
      transaction.sellerId,
      transaction.subtractWeight,
      transaction.actualWeight,
      transaction.pricePerKg,
      transaction.deposit,
      transaction.paid,
      transaction.bagData,
      transaction.totalBags,
      transaction.totalWeight,
      transaction.date,
      transaction.inputDigits || 3,
      transaction.inputFormat || 'odd',
    ],
  );
};

export const updateTransaction = async (transaction: {
  id: string;
  subtractWeight: number;
  actualWeight: number;
  pricePerKg: number;
  deposit: number;
  paid: number;
  bagData: string;
  totalBags: number;
  totalWeight: number;
  inputDigits?: number;
  inputFormat?: string;
}) => {
  const database = await getDatabase();
  await database.execute(
    'UPDATE transactions SET subtract_weight = ?, actual_weight = ?, price_per_kg = ?, deposit = ?, paid = ?, bag_data = ?, total_bags = ?, total_weight = ?, input_digits = ?, input_format = ? WHERE id = ?',
    [
      transaction.subtractWeight,
      transaction.actualWeight,
      transaction.pricePerKg,
      transaction.deposit,
      transaction.paid,
      transaction.bagData,
      transaction.totalBags,
      transaction.totalWeight,
      transaction.inputDigits || 3,
      transaction.inputFormat || 'odd',
      transaction.id,
    ],
  );
};

// Soft delete transaction
export const softDeleteTransaction = async (id: string) => {
  const database = await getDatabase();
  await database.execute(
    'UPDATE transactions SET is_deleted = 1 WHERE id = ?',
    [id],
  );
};

// Restore deleted transaction
export const restoreTransaction = async (id: string) => {
  const database = await getDatabase();
  await database.execute(
    'UPDATE transactions SET is_deleted = 0 WHERE id = ?',
    [id],
  );
};

// Get deleted transactions
export const getDeletedTransactions = async () => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM transactions WHERE is_deleted = 1 ORDER BY created_at DESC',
  );
  return result.rows?._array || [];
};

export const getAllTransactions = async () => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM transactions WHERE is_deleted = 0 ORDER BY created_at DESC',
  );
  return result.rows?._array || [];
};

export const getTransactionsBySellerId = async (sellerId: string) => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM transactions WHERE seller_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
    [sellerId],
  );
  // Map snake_case to camelCase
  const transactions = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    sellerId: row.seller_id,
    subtractWeight: row.subtract_weight,
    actualWeight: row.actual_weight,
    pricePerKg: row.price_per_kg,
    deposit: row.deposit,
    paid: row.paid,
    bagData: row.bag_data,
    totalBags: row.total_bags || 0,
    totalWeight: row.total_weight || 0,
    date: row.date,
    createdAt: row.created_at,
  }));
  return transactions;
};

export const deleteTransaction = async (id: string) => {
  const database = await getDatabase();
  await database.execute('DELETE FROM transactions WHERE id = ?', [id]);
};

// Expense operations
export const addExpense = async (expense: {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}) => {
  const database = await getDatabase();
  await database.execute(
    'INSERT INTO expenses (id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
    [
      expense.id,
      expense.type,
      expense.category,
      expense.amount,
      expense.description,
      expense.date,
    ],
  );
};

export const getAllExpenses = async () => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM expenses ORDER BY created_at DESC',
  );
  const expenses = (result.rows?._array || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    category: row.category,
    amount: row.amount,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
  }));
  return expenses;
};

export const deleteExpense = async (id: string) => {
  const database = await getDatabase();
  await database.execute('DELETE FROM expenses WHERE id = ?', [id]);
};

// Custom category operations
export const addCustomCategory = async (
  type: 'income' | 'expense',
  name: string,
) => {
  const database = await getDatabase();
  const id = Date.now().toString();
  await database.execute(
    'INSERT INTO custom_categories (id, type, name) VALUES (?, ?, ?)',
    [id, type, name],
  );
};

export const getCustomCategories = async (
  type: 'income' | 'expense',
): Promise<string[]> => {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT name FROM custom_categories WHERE type = ? ORDER BY created_at ASC',
    [type],
  );
  const categories = (result.rows?._array || []).map((row: any) => row.name);
  return categories;
};

export const deleteCustomCategory = async (
  type: 'income' | 'expense',
  name: string,
) => {
  const database = await getDatabase();
  await database.execute(
    'DELETE FROM custom_categories WHERE type = ? AND name = ?',
    [type, name],
  );
};

// Clear all data
export const clearAllData = async () => {
  const database = await getDatabase();
  
  // Delete all data from all tables
  await database.execute('DELETE FROM transactions');
  await database.execute('DELETE FROM sellers');
  await database.execute('DELETE FROM buyers');
  await database.execute('DELETE FROM expenses');
  await database.execute('DELETE FROM custom_categories');
  
  console.log('✅ All data cleared successfully');
};
