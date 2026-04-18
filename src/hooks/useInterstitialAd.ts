import { useEffect, useState } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AdConfig } from '../config/ads';

let interstitialAd: InterstitialAd | null = null;

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adUnitId = AdConfig.getAdUnitId('interstitial');

    if (!adUnitId) {
      console.log('No interstitial ad unit ID');
      return;
    }

    // Create interstitial ad
    interstitialAd = InterstitialAd.createForAdRequest(adUnitId);

    // Loaded event
    const loadedListener = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('✅ Interstitial ad loaded');
        setLoaded(true);
        setLoading(false);
      },
    );

    // Load the ad
    setLoading(true);
    interstitialAd.load();

    // Cleanup
    return () => {
      loadedListener();
    };
  }, []);

  const showAd = async () => {
    if (!interstitialAd || !loaded) {
      console.log('❌ Interstitial ad not ready');
      return false;
    }

    try {
      await interstitialAd.show();
      console.log('✅ Interstitial ad shown');

      // Reload ad for next time
      setLoaded(false);
      setLoading(true);
      interstitialAd.load();

      return true;
    } catch (error) {
      console.log('❌ Error showing interstitial ad:', error);
      return false;
    }
  };

  return {
    loaded,
    loading,
    showAd,
  };
};
