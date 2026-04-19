import { createMMKV } from 'react-native-mmkv';

let storage: any;

const getStorage = () => {
  if (!storage) {
    storage = createMMKV();
  }
  return storage;
};

export type PremiumTier = 'free' | 'tier1' | 'tier2';

export interface PremiumLimits {
  maxBuyers: number;
  maxSellersPerBuyer: number;
}

export const PREMIUM_TIERS: Record<PremiumTier, PremiumLimits> = {
  free: {
    maxBuyers: 1,
    maxSellersPerBuyer: 7,
  },
  tier1: {
    maxBuyers: 15,
    maxSellersPerBuyer: 5,
  },
  tier2: {
    maxBuyers: -1, // -1 means unlimited
    maxSellersPerBuyer: -1,
  },
};

export const PREMIUM_PRICES = {
  tier1: 50000, // 50k VND
  tier2: 100000, // 100k VND
};

const PREMIUM_TIER_KEY = 'premium.tier';

export const getPremiumTier = (): PremiumTier => {
  const tier = getStorage().getString(PREMIUM_TIER_KEY);
  return (tier as PremiumTier) || 'free';
};

export const setPremiumTier = (tier: PremiumTier) => {
  getStorage().set(PREMIUM_TIER_KEY, tier);
};

export const getPremiumLimits = (): PremiumLimits => {
  const tier = getPremiumTier();
  return PREMIUM_TIERS[tier];
};

export const canAddBuyer = (currentBuyerCount: number): boolean => {
  const limits = getPremiumLimits();
  if (limits.maxBuyers === -1) return true; // Unlimited
  return currentBuyerCount < limits.maxBuyers;
};

export const canAddSeller = (
  currentSellerCount: number,
  _buyerId: string,
): boolean => {
  const limits = getPremiumLimits();
  if (limits.maxSellersPerBuyer === -1) return true; // Unlimited
  return currentSellerCount < limits.maxSellersPerBuyer;
};

export const getRemainingBuyers = (currentBuyerCount: number): number => {
  const limits = getPremiumLimits();
  if (limits.maxBuyers === -1) return -1; // Unlimited
  return Math.max(0, limits.maxBuyers - currentBuyerCount);
};

export const getRemainingSellers = (currentSellerCount: number): number => {
  const limits = getPremiumLimits();
  if (limits.maxSellersPerBuyer === -1) return -1; // Unlimited
  return Math.max(0, limits.maxSellersPerBuyer - currentSellerCount);
};

export const isPremium = (): boolean => {
  const tier = getPremiumTier();
  return tier !== 'free';
};

export const isUnlimited = (): boolean => {
  const tier = getPremiumTier();
  return tier === 'tier2';
};
