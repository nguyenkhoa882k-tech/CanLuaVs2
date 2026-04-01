import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMMKVNumber, useMMKVString } from 'react-native-mmkv';
import { colors } from '../theme/colors';

interface InputFormatScreenProps {
  navigation: any;
}

type InputFormat = 2 | 3 | 3.1 | 4;

export const InputFormatScreen: React.FC<InputFormatScreenProps> = ({ navigation }) => {
  const [inputDigits, setInputDigits] = useMMKVNumber('inputDigits');
  const [inputFormat, setInputFormat] = useMMKVString('inputFormat');
  
  // Determine initial selected format based on current settings
  const getInitialFormat = (): InputFormat => {
    const digits = inputDigits || 3;
    const format = inputFormat || 'odd';
    
    if (digits === 2) return 2;
    if (digits === 3 && format === 'odd') return 3;
    if (digits === 3 && format === 'even') return 3.1;
    return 4;
  };
  
  const [selectedFormat, setSelectedFormat] = useState<InputFormat>(getInitialFormat());

  const handleSave = () => {
    // Map format to digits and format type
    switch (selectedFormat) {
      case 2:
        setInputDigits(2);
        setInputFormat('even');
        break;
      case 3:
        setInputDigits(3);
        setInputFormat('odd');
        break;
      case 3.1:
        setInputDigits(3);
        setInputFormat('even');
        break;
      case 4:
        setInputDigits(4);
        setInputFormat('odd');
        break;
    }
    navigation.goBack();
  };

  const formatOptions = [
    {
      group: 1,
      title: 'Nhập khối lượng < 100kg',
      color: '#E0E0E0',
      options: [
        {
          id: 2,
          label: 'Nhập 02 số (Chẵn)',
          description: 'Khối lượng < 100kg',
          example: 'VD: nhập 50kg, 51kg, 52kg...',
          bgColor: colors.white,
        },
        {
          id: 3,
          label: 'Nhập 03 số (Lẻ)',
          description: 'Khối lượng < 100kg',
          example: 'VD: khối lượng 50.0kg, 52.4kg, 52.6kg...',
          exampleInput: '=> Sẽ nhập: 500, 524, 526...',
          bgColor: '#FEF3C7',
        },
      ],
    },
    {
      group: 2,
      title: 'Nhập khối lượng >= 100kg',
      color: '#E0E0E0',
      options: [
        {
          id: 3.1,
          label: 'Nhập 03 số (Chẵn)',
          description: 'Khối lượng >= 100kg',
          example: 'VD: nhập 101kg, 110kg, 200kg...',
          bgColor: colors.white,
        },
        {
          id: 4,
          label: 'Nhập 04 số (Lẻ)',
          description: 'Khối lượng >= 100kg',
          example: 'VD: khối lượng 100.0kg, 102.4kg, 200.6kg...',
          exampleInput: '=> Sẽ nhập: 1000, 1024, 2006...',
          bgColor: colors.white,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QUY CÁCH NHẬP</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {formatOptions.map((group) => (
          <View key={group.group} style={styles.groupContainer}>
            {/* Group Header */}
            <View style={[styles.groupHeader, { backgroundColor: group.color }]}>
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{group.group}</Text>
              </View>
              <View style={styles.groupTitleContainer}>
                <Text style={styles.groupTitle}>QUY CÁCH NHẬP</Text>
                <Text style={styles.groupSubtitle}>{group.title}</Text>
              </View>
            </View>

            {/* Options */}
            {group.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: option.bgColor },
                  selectedFormat === option.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedFormat(option.id as InputFormat)}
                activeOpacity={0.7}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.radioButton}>
                    {selectedFormat === option.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                    <Text style={styles.optionExample}>{option.example}</Text>
                    {option.exampleInput && (
                      <Text style={styles.optionExampleInput}>{option.exampleInput}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Icon name="information" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Chọn quy cách nhập phù hợp với khối lượng lúa bạn thường cân
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Icon name="check" size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  groupBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  groupTitleContainer: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  groupSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
    marginTop: 2,
  },
  optionCard: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionCardSelected: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  optionHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  optionExample: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  optionExampleInput: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
