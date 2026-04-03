import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv';
import Speech from '@mhpdev/react-native-speech';

interface TTSSettingsScreenProps {
  navigation: any;
}

type TTSSpeed = 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast';

const speedOptions = [
  { id: 'very-slow', label: 'Đọc rất nhanh', rate: 0.8 },
  { id: 'slow', label: 'Đọc nhanh', rate: 0.6 },
  { id: 'normal', label: 'Đọc vừa (Mặc định)', rate: 0.5 },
  { id: 'fast', label: 'Đọc chậm', rate: 0.4 },
  { id: 'very-fast', label: 'Đọc rất chậm', rate: 0.3 },
];

// Helper function to test TTS with fallbacks
const testTTSWithFallbacks = async (text: string, rate: number = 0.5) => {
  const testConfigs = [
    { text, language: 'vi-VN', rate, volume: 1.0, ducking: true },
    { text, language: 'vi', rate, volume: 1.0, ducking: true },
    {
      text: 'Test speech',
      language: 'en-US',
      rate,
      volume: 1.0,
      ducking: true,
    },
    { text: 'Hello', language: 'en', rate: 0.5, volume: 1.0, ducking: true },
    { text: 'Test', rate: 0.5, volume: 1.0, ducking: true }, // No language specified
  ];

  for (const config of testConfigs) {
    try {
      console.log(
        `TTS Test - Trying: "${config.text}" (${config.language || 'default'})`,
      );

      // Stop any previous speech
      await Speech.stop();
      await new Promise(resolve => setTimeout(resolve, 200));

      const speechId = await Speech.speak(config.text, {
        language: config.language,
        rate: config.rate,
        volume: config.volume,
        ducking: config.ducking,
        pitch: 1.0,
      });

      console.log(`TTS Test - Success with ID: ${speechId}`);

      // Check if actually speaking
      setTimeout(async () => {
        const isSpeaking = await Speech.isSpeaking();
        console.log(`TTS Test - Is speaking after 500ms: ${isSpeaking}`);
      }, 500);

      return true;
    } catch (error) {
      console.error(
        `TTS Test - Failed with ${config.language || 'default'}:`,
        error,
      );
    }
  }

  console.error('TTS Test - All fallbacks failed');
  return false;
};

export const TTSSettingsScreen: React.FC<TTSSettingsScreenProps> = ({
  navigation,
}) => {
  const [enableTTS, setEnableTTS] = useMMKVBoolean('enableTTS');
  const [ttsSpeed, setTtsSpeed] = useMMKVNumber('ttsSpeed');

  const currentSpeed = (ttsSpeed || 0.5) as number;
  const selectedSpeedId =
    speedOptions.find(option => option.rate === currentSpeed)?.id || 'normal';

  const handleTTSToggle = async (value: boolean) => {
    console.log('TTS Toggle:', value);
    setEnableTTS(value);

    if (value) {
      console.log('TTS Toggle - Testing speech...');
      setTimeout(async () => {
        await testTTSWithFallbacks('Đã bật đọc số thành tiếng', 0.5);
      }, 300);
    }
  };

  const handleSpeedSelect = async (speedId: TTSSpeed) => {
    const selectedOption = speedOptions.find(option => option.id === speedId);
    if (!selectedOption) return;

    setTtsSpeed(selectedOption.rate);

    // Test TTS with sample weights if TTS is enabled
    if (enableTTS) {
      try {
        console.log(
          'TTS Test - Starting speech with rate:',
          selectedOption.rate,
        );

        // Test with different weights - simpler Vietnamese text
        const testWeights = [
          'ba mười ki-lô-gam',
          'năm mười hai ki-lô-gam',
          'bảy mười tám ki-lô-gam',
          'chín mười lăm ki-lô-gam',
        ];
        const randomWeight =
          testWeights[Math.floor(Math.random() * testWeights.length)];

        console.log('TTS Test - Speaking:', randomWeight);

        // Add a small delay to ensure TTS is ready
        setTimeout(async () => {
          await testTTSWithFallbacks(randomWeight, selectedOption.rate);
        }, 200);
      } catch (error) {
        console.error('TTS test error:', error);
      }
    } else {
      console.log('TTS Test - TTS is disabled, not speaking');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.success} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐỌC SỐ THÀNH TIẾNG</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => navigation.navigate('TTSTest')}
        >
          <Icon name="bug" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="cog" size={20} color="#E91E63" />
            <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Đọc số thành tiếng</Text>
              <Text style={styles.settingSubtitle}>
                Số được đọc thành tiếng sau khi nhập mã cân.
              </Text>
            </View>
            <Switch
              value={enableTTS || false}
              onValueChange={handleTTSToggle}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Speed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="speedometer" size={20} color="#E91E63" />
            <Text style={styles.sectionTitle}>TỐC ĐỘ ĐỌC</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Hãy chọn và lắng nghe</Text>

          {speedOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={styles.speedOption}
              onPress={() => handleSpeedSelect(option.id as TTSSpeed)}
              activeOpacity={0.7}
            >
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioButton,
                    selectedSpeedId === option.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedSpeedId === option.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.speedLabel,
                  selectedSpeedId === option.id && styles.speedLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  testButton: {
    padding: 4,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  radioContainer: {
    marginRight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.success,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  speedLabel: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  speedLabelSelected: {
    fontWeight: '600',
    color: colors.success,
  },
});
