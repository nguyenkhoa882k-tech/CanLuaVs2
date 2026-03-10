import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import * as db from '../services/database';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string,
  ) => void;
}

const DEFAULT_INCOME_CATEGORIES = ['Bán lúa', 'Thu khác'];
const DEFAULT_EXPENSE_CATEGORIES = ['Xăng', 'Công', 'Phân bón', 'Chi khác'];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Custom categories
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  
  // Add category modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load custom categories from storage
  useEffect(() => {
    const loadCustomCategories = async () => {
      try {
        const savedIncome = await db.getCustomCategories('income');
        const savedExpense = await db.getCustomCategories('expense');
        
        if (savedIncome.length > 0) {
          setIncomeCategories([...DEFAULT_INCOME_CATEGORIES, ...savedIncome]);
        }
        if (savedExpense.length > 0) {
          setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES, ...savedExpense]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    if (visible) {
      loadCustomCategories();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!category || !amount) {
      return;
    }

    onAdd(type, category, parseFloat(amount), description);
    handleClose();
  };

  const handleClose = () => {
    setType('expense');
    setCategory('');
    setAmount('');
    setDisplayAmount('');
    setDescription('');
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) {
      setAmount('0');
      setDisplayAmount('');
      return;
    }
    setAmount(numericValue);
    setDisplayAmount(parseInt(numericValue, 10).toLocaleString('vi-VN'));
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }
    
    const currentCategories = type === 'income' ? incomeCategories : expenseCategories;
    
    if (currentCategories.includes(trimmedName)) {
      Alert.alert('Lỗi', 'Danh mục này đã tồn tại');
      return;
    }
    
    try {
      await db.addCustomCategory(type, trimmedName);
      
      const updatedCategories = [...currentCategories, trimmedName];
      
      if (type === 'income') {
        setIncomeCategories(updatedCategories);
      } else {
        setExpenseCategories(updatedCategories);
      }
      
      setCategory(trimmedName);
      setNewCategoryName('');
      setShowAddCategoryModal(false);
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Lỗi', 'Không thể thêm danh mục');
    }
  };

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Thêm khoản {type === 'income' ? 'thu' : 'chi'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Type Selector */}
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && styles.typeButtonIncome,
                ]}
                onPress={() => {
                  setType('income');
                  setCategory('');
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === 'income' && styles.typeTextActive,
                  ]}
                >
                  📈 Thu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonExpense,
                ]}
                onPress={() => {
                  setType('expense');
                  setCategory('');
                }}
              >
                <Text
                  style={[
                    styles.typeText,
                    type === 'expense' && styles.typeTextActive,
                  ]}
                >
                  📉 Chi
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.categoryContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* Add Category Button */}
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setShowAddCategoryModal(true)}
              >
                <Text style={styles.addCategoryIcon}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text style={styles.label}>Số tiền (đ)</Text>
            <TextInput
              style={styles.input}
              value={displayAmount}
              onChangeText={handleAmountChange}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.text.light}
            />

            {/* Description */}
            <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Nhập ghi chú..."
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.text.light}
            />
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!category || !amount) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!category || !amount}
          >
            <Text style={styles.submitText}>Thêm</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add Category Modal */}
        <Modal
          visible={showAddCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddCategoryModal(false)}
        >
          <View style={styles.addCategoryModalContainer}>
            <TouchableOpacity
              style={styles.addCategoryOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName('');
              }}
            />
            <View style={styles.addCategoryModal}>
              <Text style={styles.addCategoryTitle}>Tạo danh mục mới</Text>
              <TextInput
                style={styles.addCategoryInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Nhập tên danh mục..."
                placeholderTextColor={colors.text.light}
                autoFocus
              />
              <View style={styles.addCategoryButtons}>
                <TouchableOpacity
                  style={[styles.addCategoryBtn, styles.cancelBtn]}
                  onPress={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addCategoryBtn, styles.confirmBtn]}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.confirmBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  content: {
    padding: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  typeButtonIncome: {
    backgroundColor: '#D1FAE5',
  },
  typeButtonExpense: {
    backgroundColor: '#FEE2E2',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  typeTextActive: {
    color: colors.text.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  addCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  addCategoryModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addCategoryModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  addCategoryInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addCategoryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.background,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
