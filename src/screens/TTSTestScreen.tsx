import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import Speech from '@mhpdev/react-native-speech';

interface TTSTestScreenProps {
  navigation: any;
}

export const TTSTestScreen: React.FC<TTSTestScreenProps> = ({ navigation }) => {
  const [availableVoices, setAvailableVoices] = React.useState<any[]>([]);
  const [availableEngines, setAvailableEngines] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Check available voices and engines when component mounts
    checkAvailableVoices();
    checkAvailableEngines();

    // Setup event listeners according to documentation
    const startSubscription = Speech.onStart(({ id }) => {
      console.log(`🎤 TTS Event - Speech started (ID: ${id})`);
    });

    const finishSubscription = Speech.onFinish(({ id }) => {
      console.log(`✅ TTS Event - Speech finished (ID: ${id})`);
    });

    const errorSubscription = Speech.onError(({ id }) => {
      console.log(`❌ TTS Event - Speech error (ID: ${id})`);
    });

    return () => {
      // Cleanup subscriptions
      startSubscription.remove();
      finishSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  const checkAvailableVoices = async () => {
    try {
      console.log('🔍 Checking available TTS voices...');
      const allVoices = await Speech.getAvailableVoices();
      console.log('📋 All available voices:', allVoices);
      setAvailableVoices(allVoices);

      // Check specifically for Vietnamese voices
      const vietnameseVoices = await Speech.getAvailableVoices('vi');
      console.log('🇻🇳 Vietnamese voices:', vietnameseVoices);

      // Check for English voices
      const englishVoices = await Speech.getAvailableVoices('en');
      console.log('🇺🇸 English voices:', englishVoices);
    } catch (error) {
      console.error('❌ Error checking voices:', error);
    }
  };

  const checkAvailableEngines = async () => {
    try {
      console.log('🔍 Checking available TTS engines...');
      const engines = await Speech.getEngines();
      console.log('⚙️ Available engines:', engines);
      setAvailableEngines(engines);

      // Log default engine
      const defaultEngine = engines.find(e => e.isDefault);
      if (defaultEngine) {
        console.log(
          `🎯 Default engine: ${defaultEngine.label} (${defaultEngine.name})`,
        );
      }
    } catch (error) {
      console.error('❌ Error checking engines:', error);
    }
  };

  const testTTS = async (text: string, language?: string) => {
    try {
      console.log(`🧪 Testing TTS: "${text}" (${language || 'default'})`);

      // Stop any previous speech
      await Speech.stop();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if currently speaking
      const isSpeaking = await Speech.isSpeaking();
      console.log(`🔊 Is currently speaking before test: ${isSpeaking}`);

      const speechOptions: any = {
        rate: 0.5,
        volume: 1.0,
        pitch: 1.0,
        ducking: true, // Enable audio ducking to ensure TTS gets audio focus
      };

      // Only add language if it's provided
      if (language) {
        speechOptions.language = language;
      }

      console.log('⚙️ TTS Options:', JSON.stringify(speechOptions));

      const speechId = await Speech.speak(text, speechOptions);

      console.log(`🚀 TTS Success - Speech queued with ID: ${speechId}`);

      // Check if speaking after call
      setTimeout(async () => {
        const isSpeakingAfter = await Speech.isSpeaking();
        console.log(`🔊 Is speaking after call: ${isSpeakingAfter}`);
      }, 500);
    } catch (error) {
      console.error(`❌ TTS Error (${language || 'default'}):`, error);
    }
  };

  const openVoiceInstaller = async () => {
    try {
      console.log('📱 Opening voice data installer...');
      await Speech.openVoiceDataInstaller();
    } catch (error) {
      console.error('❌ Error opening voice installer:', error);
    }
  };

  const checkIsSpeaking = async () => {
    try {
      const isSpeaking = await Speech.isSpeaking();
      console.log(`🔊 Is currently speaking: ${isSpeaking}`);
    } catch (error) {
      console.error('❌ Error checking speaking status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TTS Debug</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Basic Tests</Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('Hello world', 'en-US')}
        >
          <Text style={styles.buttonText}>🇺🇸 Test English (en-US)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('Test simple', 'en')}
        >
          <Text style={styles.buttonText}>🇺🇸 Test English Simple (en)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('Xin chào', 'vi-VN')}
        >
          <Text style={styles.buttonText}>🇻🇳 Test Vietnamese Simple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('Xin chào', 'vi')}
        >
          <Text style={styles.buttonText}>🇻🇳 Test Vietnamese (vi)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('ba mười phẩy bốn ki-lô-gam', 'vi-VN')}
        >
          <Text style={styles.buttonText}>🇻🇳 Test Vietnamese Complex</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => testTTS('Test default language')}
        >
          <Text style={styles.buttonText}>🌐 Test Default Language</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Controls</Text>

        <TouchableOpacity
          style={[styles.testButton, styles.stopButton]}
          onPress={() => Speech.stop()}
        >
          <Text style={styles.buttonText}>⏹️ Stop Speech</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={checkIsSpeaking}>
          <Text style={styles.buttonText}>🔊 Check Is Speaking</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>System Tools</Text>

        <TouchableOpacity
          style={[styles.testButton, styles.systemButton]}
          onPress={openVoiceInstaller}
        >
          <Text style={styles.buttonText}>📱 Open Voice Installer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.systemButton]}
          onPress={checkAvailableVoices}
        >
          <Text style={styles.buttonText}>🔍 Check Available Voices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.systemButton]}
          onPress={checkAvailableEngines}
        >
          <Text style={styles.buttonText}>⚙️ Check Available Engines</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.systemButton]}
          onPress={async () => {
            console.log('🔧 Running comprehensive TTS diagnostics...');

            // 1. Check if TTS is speaking
            const isSpeaking = await Speech.isSpeaking();
            console.log(`🔊 Currently speaking: ${isSpeaking}`);

            // 2. Stop any current speech
            await Speech.stop();
            console.log('⏹️ Stopped any current speech');

            // 3. Check available voices
            const allVoices = await Speech.getAvailableVoices();
            console.log(`📋 Total voices available: ${allVoices.length}`);

            const viVoices = await Speech.getAvailableVoices('vi');
            console.log(`🇻🇳 Vietnamese voices: ${viVoices.length}`);

            const enVoices = await Speech.getAvailableVoices('en');
            console.log(`🇺🇸 English voices: ${enVoices.length}`);

            // 4. Check engines (Android only)
            try {
              const engines = await Speech.getEngines();
              console.log(`⚙️ TTS engines available: ${engines.length}`);
              engines.forEach(engine => {
                console.log(
                  `  - ${engine.label} (${engine.name}) ${
                    engine.isDefault ? '[DEFAULT]' : ''
                  }`,
                );
              });
            } catch (e) {
              console.log('⚙️ Engine check not supported (iOS)');
            }

            // 5. Test simple speech with maximum compatibility
            try {
              console.log('🧪 Testing simple speech...');
              const speechId = await Speech.speak('Test', {
                volume: 1.0,
                rate: 0.5,
                pitch: 1.0,
                ducking: true,
              });
              console.log(`✅ Simple speech queued: ${speechId}`);

              // Check if speaking after 1 second
              setTimeout(async () => {
                const stillSpeaking = await Speech.isSpeaking();
                console.log(`🔊 Still speaking after 1s: ${stillSpeaking}`);
              }, 1000);
            } catch (error) {
              console.error('❌ Simple speech failed:', error);
            }
          }}
        >
          <Text style={styles.buttonText}>🔧 Run Full Diagnostics</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Debug Info:</Text>
          <Text style={styles.infoText}>Voices: {availableVoices.length}</Text>
          <Text style={styles.infoText}>
            Engines: {availableEngines.length}
          </Text>
          <Text style={styles.infoText}>Check console for detailed logs</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  systemButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
});
