import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import { colors } from '../theme/colors';

interface AddBuyerModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    phone: string,
    category?: string,
    vehicleNumber?: string,
  ) => void;
}

export const AddBuyerModal: React.FC<AddBuyerModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [category, setCategory] = useState<'export' | 'import' | undefined>(
    undefined,
  );
  const [showGroupCategory = false] = useMMKVBoolean(
    'display.showGroupCategory',
  );
  const [showVehicleNumber = false] = useMMKVBoolean(
    'display.showVehicleNumber',
  );

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim(), phone.trim(), category, vehicleNumber.trim());
      setName('');
      setPhone('');
      setVehicleNumber('');
      setCategory(undefined);
      onClose();
    }
  };

  const handleCancel = () => {
    setName('');
    setPhone('');
    setVehicleNumber('');
    setCategory(undefined);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.icon}>+</Text>
              <Text style={styles.title}>Thêm người mua</Text>
            </View>
            <Text style={styles.subtitle}>Nhập thông tin chủ nhóm/ghe/xe</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Tên <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên chủ ghe..."
                  placeholderTextColor={colors.text.light}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại..."
                  placeholderTextColor={colors.text.light}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {showVehicleNumber && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Biển số Xe/Ghe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập biển số xe/ghe..."
                    placeholderTextColor={colors.text.light}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                  />
                </View>
              )}

              {showGroupCategory && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phân loại nhóm</Text>
                  <View style={styles.categoryRow}>
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        category === 'export' && styles.categoryButtonActive,
                      ]}
                      onPress={() =>
                        setCategory(
                          category === 'export' ? undefined : 'export',
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === 'export' &&
                            styles.categoryButtonTextActive,
                        ]}
                      >
                        Xuất hàng
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        category === 'import' && styles.categoryButtonActive,
                      ]}
                      onPress={() =>
                        setCategory(
                          category === 'import' ? undefined : 'import',
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === 'import' &&
                            styles.categoryButtonTextActive,
                        ]}
                      >
                        Nhập hàng
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  !name.trim() && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>Thêm mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    // alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryButtonTextActive: {
    color: colors.primary,
  },
});
