import mobileAds from 'react-native-google-mobile-ads';

export const initializeAdMob = async () => {
  try {
    await mobileAds().initialize();
    console.log('AdMob initialized successfully');

    // Optional: Set request configuration
    await mobileAds().setRequestConfiguration({
      // Max Ad Content Rating
      maxAdContentRating: 'G', // G, PG, T, MA

      // Tag for child-directed treatment
      tagForChildDirectedTreatment: false,

      // Tag for under age of consent
      tagForUnderAgeOfConsent: false,

      // Test device IDs (add your test device IDs here)
      testDeviceIdentifiers: [
        // Add your test device IDs here
        // You can find your device ID in logcat when you run the app
      ],
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize AdMob:', error);
    return false;
  }
};
