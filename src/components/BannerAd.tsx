import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd as GoogleBannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import { AdConfig } from '../config/ads';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface BannerAdProps {
  size?: BannerAdSize;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
  const { isConnected } = useNetworkStatus();
  const adUnitId = AdConfig.getAdUnitId('banner');

  // Don't show ad if no internet connection or no ad unit ID
  if (!isConnected || !adUnitId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={error => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
  },
});
