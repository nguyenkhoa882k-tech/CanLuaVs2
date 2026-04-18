import { useEffect, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { AdConfig } from '../config/ads';

let rewardedAd: RewardedAd | null = null;

export const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    const adUnitId = AdConfig.getAdUnitId('rewarded');

    if (!adUnitId) {
      console.log('No rewarded ad unit ID');
      return;
    }

    // Create rewarded ad
    rewardedAd = RewardedAd.createForAdRequest(adUnitId);

    // Loaded event
    const loadedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('✅ Rewarded ad loaded');
        setLoaded(true);
        setLoading(false);
      },
    );

    // Earned reward event
    const earnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('✅ User earned reward:', reward);
        setRewarded(true);
      },
    );

    // Load the ad
    setLoading(true);
    rewardedAd.load();

    // Cleanup
    return () => {
      loadedListener();
      earnedListener();
    };
  }, []);

  const showAd = async (): Promise<boolean> => {
    if (!rewardedAd || !loaded) {
      console.log('❌ Rewarded ad not ready');
      return false;
    }

    try {
      setRewarded(false);
      await rewardedAd.show();

      // Wait a bit for rewarded state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Rewarded state:', rewarded);
      return rewarded;
    } catch (error) {
      console.log('❌ Error showing rewarded ad:', error);
      return false;
    }
  };

  return {
    loaded,
    loading,
    rewarded,
    showAd,
  };
};
