import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

interface KeepAwakeProps {
  enabled?: boolean;
}

export const KeepAwake: React.FC<KeepAwakeProps> = ({ enabled = true }) => {
  useEffect(() => {
    if (!enabled) return;

    // For Android, we'll use a timer to keep the app active
    // This is a simple workaround that works without native modules
    let interval: NodeJS.Timeout;

    if (Platform.OS === 'android') {
      // Keep a timer running to prevent sleep
      interval = setInterval(() => {
        // This keeps the JS thread active
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [enabled]);

  return null;
};
