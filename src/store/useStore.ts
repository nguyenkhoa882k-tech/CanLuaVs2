import { create } from 'zustand';
import * as db from '../services/database';

interface Transaction {
  id: string;
  name: string;
  date: string;
  weight: number;
  bags: number;
  phone: string;
}

interface Buyer {
  id: string;
  name: string;
  phone: string;
}

interface Seller {
  id: string;
  buyerId: string;
  name: string;
  price: number;
  date: string;
}

interface StoreState {
  transactions: Transaction[];
  buyers: Buyer[];
  sellers: Seller[];
  totalWeight: number;
  totalBags: number;
  totalTransactions: number;
  isLoading: boolean;
  inputDigits: 3 | 4; // Configuration for input digits
  setInputDigits: (digits: 3 | 4) => void;
  loadBuyers: () => Promise<void>;
  loadSellers: (buyerId: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBuyer: (buyer: Buyer) => Promise<void>;
  deleteBuyer: (id: string) => Promise<void>;
  addSeller: (seller: Seller) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  transactions: [],
  buyers: [],
  sellers: [],
  totalWeight: 0,
  totalBags: 0,
  totalTransactions: 0,
  isLoading: false,
  inputDigits: 3, // Default to 3 digits

  setInputDigits: (digits: 3 | 4) => {
    set({ inputDigits: digits });
  },

  loadBuyers: async () => {
    try {
      set({ isLoading: true });
      const buyers = await db.getAllBuyers();
      set({ buyers, isLoading: false });
    } catch (error) {
      console.error('Error loading buyers:', error);
      set({ isLoading: false });
    }
  },

  loadSellers: async (buyerId: string) => {
    try {
      set({ isLoading: true });
      const sellers = await db.getSellersByBuyerId(buyerId);
      set({ sellers, isLoading: false });
    } catch (error) {
      console.error('Error loading sellers:', error);
      set({ isLoading: false });
    }
  },

  addTransaction: async transaction => {
    try {
      await db.addTransaction({ ...transaction, sellerId: '' });
      set(state => ({
        transactions: [transaction, ...state.transactions],
        totalWeight: state.totalWeight + transaction.weight,
        totalBags: state.totalBags + transaction.bags,
        totalTransactions: state.totalTransactions + 1,
      }));
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  },

  deleteTransaction: async id => {
    try {
      await db.deleteTransaction(id);
      set(state => {
        const transaction = state.transactions.find(t => t.id === id);
        return {
          transactions: state.transactions.filter(t => t.id !== id),
          totalWeight: transaction
            ? state.totalWeight - transaction.weight
            : state.totalWeight,
          totalBags: transaction
            ? state.totalBags - transaction.bags
            : state.totalBags,
          totalTransactions: state.totalTransactions - 1,
        };
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  },

  addBuyer: async buyer => {
    try {
      await db.addBuyer(buyer);
      set(state => ({
        buyers: [buyer, ...state.buyers],
      }));
    } catch (error) {
      console.error('Error adding buyer:', error);
    }
  },

  deleteBuyer: async id => {
    try {
      await db.deleteBuyer(id);
      set(state => ({
        buyers: state.buyers.filter(b => b.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting buyer:', error);
    }
  },

  addSeller: async seller => {
    try {
      await db.addSeller(seller);
      set(state => ({
        sellers: [seller, ...state.sellers],
      }));
    } catch (error) {
      console.error('Error adding seller:', error);
    }
  },

  deleteSeller: async id => {
    try {
      await db.deleteSeller(id);
      set(state => ({
        sellers: state.sellers.filter(s => s.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting seller:', error);
    }
  },
}));
