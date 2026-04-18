import { Platform } from 'react-native';

// Test Ad Unit IDs from Google AdMob
// These are safe to use during development
// Replace with your real Ad Unit IDs when you have an AdMob account

export const AdConfig = {
  // Test mode - set to false when using real ads
  isTestMode: true,

  // Test Ad Unit IDs (provided by Google for testing)
  testIds: {
    banner: Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716',
      android: 'ca-app-pub-3940256099942544/6300978111',
    }),
    interstitial: Platform.select({
      ios: 'ca-app-pub-3940256099942544/4411468910',
      android: 'ca-app-pub-3940256099942544/1033173712',
    }),
    rewarded: Platform.select({
      ios: 'ca-app-pub-3940256099942544/1712485313',
      android: 'ca-app-pub-3940256099942544/5224354917',
    }),
  },

  // Real Ad Unit IDs (replace these when you have an AdMob account)
  // Get these from: https://apps.admob.com/
  realIds: {
    banner: Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS banner ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your Android banner ID
    }),
    interstitial: Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS interstitial ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your Android interstitial ID
    }),
    rewarded: Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your iOS rewarded ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with your Android rewarded ID
    }),
  },

  // Get the appropriate Ad Unit ID based on test mode
  getAdUnitId: (adType: 'banner' | 'interstitial' | 'rewarded'): string => {
    const ids = AdConfig.isTestMode ? AdConfig.testIds : AdConfig.realIds;
    return ids[adType] || '';
  },
};

// Ad placement strategy
export const AdPlacement = {
  // Banner ads - show on these screens
  banner: {
    homeScreen: true, // Show banner on home screen
    statsScreen: true, // Show banner on stats screen
    collectionScreen: true, // Show banner on collection screen
    settingsScreen: false, // Don't show on settings (better UX)
    weighingScreen: false, // Don't show during weighing (important task)
  },

  // Interstitial ads - show after these actions
  interstitial: {
    afterWeighingComplete: true, // After completing a weighing session
    afterViewingStats: false, // Don't interrupt stats viewing
    frequency: 3, // Show every 3 weighing sessions
  },

  // Rewarded ads - optional premium features
  rewarded: {
    exportDataWithoutAds: false, // Future: export without seeing ads
    unlockPremiumThemes: false, // Future: unlock themes
  },
};
