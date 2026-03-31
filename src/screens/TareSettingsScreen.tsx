import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv';

interface TareSettingsScreenProps {
  navigation: any;
}

export const TareSettingsScreen: React.FC<TareSettingsScreenProps> = ({ navigation }) => {
  // false = số bao/kg (mặc định), true = trừ bì trên lần cân
  const [useTarePerWeighing, setUseTarePerWeighing] = useMMKVBoolean('tare.useTarePerWeighing');
  const [tarePerWeighing, setTarePerWeighing] = useMMKVNumber('tare.perWeighing');
  const [bagsPerKg, setBagsPerKg] = useMMKVNumber('tare.bagsPerKg');

  const [inputValue, setInputValue] = useState(
    useTarePerWeighing 
      ? (tarePerWeighing || 0).toString() 
      : (bagsPerKg || 8).toString()
  );

  const handleSave = () => {
    const value = parseFloat(inputValue);
    
    if (isNaN(value)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ');
      return;
    }

    if (useTarePerWeighing) {
      setTarePerWeighing(value);
    } else {
      if (value <= 0) {
        Alert.alert('Lỗi', 'Số bao trên 1kg phải lớn hơn 0');
        return;
      }
      setBagsPerKg(value);
    }

    Alert.alert('✅ Đã lưu', 'Cài đặt trừ bì đã được lưu thành công', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleToggle = (value: boolean) => {
    setUseTarePerWeighing(value);
    // Update input value when switching modes
    if (value) {
      setInputValue((tarePerWeighing || 0).toString());
    } else {
      setInputValue((bagsPerKg || 8).toString());
    }
  };

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
        <Text style={styles.headerTitle}>TRỪ BÌ</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Icon name="content-save" size={20} color={colors.text.primary} />
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Mode Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Trừ bì trên lần cân</Text>
            <Switch
              value={useTarePerWeighing}
              onValueChange={handleToggle}
              trackColor={{ false: '#E0E0E0', true: colors.secondary }}
              thumbColor={colors.white}
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          <Text style={styles.description}>
            Nếu bạn muốn trừ bì trực tiếp trên lần cân hãy bật sáng lên. Nếu tắt sẽ trừ bì theo số bao/1 kg.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>
            {useTarePerWeighing ? 'Trừ bì trên 1 lần cân' : 'Số bao trên 1kg'}
          </Text>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                !useTarePerWeighing && styles.inputDisabled
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholder={useTarePerWeighing ? "0.00" : "8"}
              placeholderTextColor="#BDBDBD"
              editable={useTarePerWeighing}
            />
            <Text style={styles.inputUnit}>
              {useTarePerWeighing ? 'KG / 1 Lần' : 'BAO / 1KG'}
            </Text>
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>(*) Chú ý:</Text>
            {useTarePerWeighing ? (
              <Text style={styles.noteText}>
                Khối lượng trừ bì sẽ tính trên 1 lần cân.
              </Text>
            ) : (
              <View>
                <Text style={styles.noteText}>
                  • Số bao tương ứng với số lần cân (1 lần cân = 1 bao).
                </Text>
                <Text style={styles.noteText}>
                  • Khối lượng trừ bì = Số bao đã cân / Số bao trên 1 kg.
                </Text>
                <Text style={styles.noteText}>
                  • VD: 100 bao đã cân, cài đặt 8 bao/1kg {'=>'} 100/8 = 12.5 kg
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color={colors.text.primary} />
            <Text style={styles.cancelButtonText}>Thoát</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.saveButtonLarge}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Icon name="content-save" size={20} color={colors.text.primary} />
            <Text style={styles.saveButtonLargeText}>Lưu lại</Text>
          </TouchableOpacity>
        </View>
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
    width: 80,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    width: 80,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    color: '#757575',
  },
  inputUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: '#D32F2F',
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
