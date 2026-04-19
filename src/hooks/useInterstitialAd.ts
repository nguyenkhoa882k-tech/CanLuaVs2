import { useEffect, useState } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import NetInfo from '@react-native-community/netinfo';
import { AdConfig } from '../config/ads';

let interstitialAd: InterstitialAd | null = null;

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const adUnitId = AdConfig.getAdUnitId('interstitial');

    // Don't load ad if no internet or no ad unit ID
    if (!isConnected || !adUnitId) {
      console.log('No internet or no interstitial ad unit ID');
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
  }, [isConnected]);

  const showAd = async () => {
    // Don't show ad if no internet connection
    if (!isConnected) {
      console.log('❌ No internet connection - skipping ad');
      return false;
    }

    if (!interstitialAd || !loaded) {
      console.log('❌ Interstitial ad not ready');
      return false;
    }

    try {
      await interstitialAd.show();
      console.log('✅ Interstitial ad shown');

      // Reload ad for next time (only if still connected)
      if (isConnected) {
        setLoaded(false);
        setLoading(true);
        interstitialAd.load();
      }

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
