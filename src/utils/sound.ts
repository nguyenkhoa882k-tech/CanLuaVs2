/**
 * Sound utility for playing beep sounds
 * Uses react-native-sound for audio playback
 */

import { Vibration } from 'react-native';
import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

// Cache sound instance
let beepSound: Sound | null = null;

/**
 * Initialize beep sound
 * Uses system notification sound as fallback
 */
const initBeepSound = () => {
  if (beepSound) return beepSound;

  try {
    // Try to load custom beep sound from assets
    // File: beep_sound.wav (renamed to comply with Android resource naming)
    beepSound = new Sound('beep_sound.wav', Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.log('Custom beep sound not found, will use vibration fallback');
        beepSound = null;
      }
    });
    return beepSound;
  } catch (error) {
    console.log('Error initializing beep sound:', error);
    return null;
  }
};

/**
 * Play a beep sound
 * Falls back to vibration if sound is not available
 */
export const playBeep = () => {
  const sound = initBeepSound();

  if (sound && sound.isLoaded()) {
    // Play the sound
    sound.play(success => {
      if (!success) {
        console.log('Playback failed, using vibration fallback');
        // Fallback to vibration
        Vibration.vibrate([0, 50, 50, 50, 50, 50]);
      }
    });
  } else {
    // Fallback to vibration if sound not available
    // Triple short vibration pattern to simulate beep
    Vibration.vibrate([0, 50, 50, 50, 50, 50]);
  }
};

/**
 * Play alert vibration
 * Longer pattern for alerts
 */
export const playAlertVibration = () => {
  // Double buzz pattern
  // [delay, vibrate, pause, vibrate]
  Vibration.vibrate([0, 200, 100, 200]);
};

/**
 * Release sound resources
 * Call this when app is closing or sound is no longer needed
 */
export const releaseSound = () => {
  if (beepSound) {
    beepSound.release();
    beepSound = null;
  }
};
