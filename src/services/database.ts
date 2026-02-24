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

    // Drop old transactions table if exists
    try {
      await db.execute('DROP TABLE IF EXISTS transactions');
    } catch (error) {
      console.log('No old transactions table to drop');
    }

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS buyers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
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
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        subtract_weight REAL DEFAULT 0,
        actual_weight REAL DEFAULT 0,
        price_per_kg REAL NOT NULL,
        deposit REAL DEFAULT 0,
        paid REAL DEFAULT 0,
        bag_data TEXT,
        date TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (seller_id) REFERENCES sellers (id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// Buyer operations
export const addBuyer = async (buyer: {
  id: string;
  name: string;
  phone: string;
}) => {
  const database = getDatabase();
  await database.execute(
    'INSERT INTO buyers (id, name, phone) VALUES (?, ?, ?)',
    [buyer.id, buyer.name, buyer.phone],
  );
};

export const getAllBuyers = async () => {
  const database = getDatabase();
  const result = await database.execute(
    'SELECT * FROM buyers ORDER BY created_at DESC',
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
  const database = getDatabase();
  await database.execute('DELETE FROM buyers WHERE id = ?', [id]);
};

// Seller operations
export const addSeller = async (seller: {
  id: string;
  buyerId: string;
  name: string;
  price: number;
  date: string;
}) => {
  const database = getDatabase();
  await database.execute(
    'INSERT INTO sellers (id, buyer_id, name, price, date) VALUES (?, ?, ?, ?, ?)',
    [seller.id, seller.buyerId, seller.name, seller.price, seller.date],
  );
};

export const getSellersByBuyerId = async (buyerId: string) => {
  const database = getDatabase();
  const result = await database.execute(
    'SELECT * FROM sellers WHERE buyer_id = ? ORDER BY created_at DESC',
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
  const database = getDatabase();
  await database.execute('DELETE FROM sellers WHERE id = ?', [id]);
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
  date: string;
}) => {
  const database = getDatabase();
  await database.execute(
    'INSERT INTO transactions (id, seller_id, subtract_weight, actual_weight, price_per_kg, deposit, paid, bag_data, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      transaction.id,
      transaction.sellerId,
      transaction.subtractWeight,
      transaction.actualWeight,
      transaction.pricePerKg,
      transaction.deposit,
      transaction.paid,
      transaction.bagData,
      transaction.date,
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
}) => {
  const database = getDatabase();
  await database.execute(
    'UPDATE transactions SET subtract_weight = ?, actual_weight = ?, price_per_kg = ?, deposit = ?, paid = ?, bag_data = ? WHERE id = ?',
    [
      transaction.subtractWeight,
      transaction.actualWeight,
      transaction.pricePerKg,
      transaction.deposit,
      transaction.paid,
      transaction.bagData,
      transaction.id,
    ],
  );
};

export const getAllTransactions = async () => {
  const database = getDatabase();
  const result = await database.execute(
    'SELECT * FROM transactions ORDER BY created_at DESC',
  );
  return result.rows?._array || [];
};

export const getTransactionsBySellerId = async (sellerId: string) => {
  const database = getDatabase();
  const result = await database.execute(
    'SELECT * FROM transactions WHERE seller_id = ? ORDER BY created_at DESC',
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
    date: row.date,
    createdAt: row.created_at,
  }));
  return transactions;
};

export const deleteTransaction = async (id: string) => {
  const database = getDatabase();
  await database.execute('DELETE FROM transactions WHERE id = ?', [id]);
};
