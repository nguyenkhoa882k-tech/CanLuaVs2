import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-gifted-charts';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';
import { AddExpenseModal } from '../components/AddExpenseModal';
import * as db from '../services/database';


type TabType = 'all' | 'rice' | 'income' | 'expense';

export const CollectionScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { loadBuyers } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Rice transactions
  const [riceTransactions, setRiceTransactions] = useState<any[]>([]);
  const [totalRiceRevenue, setTotalRiceRevenue] = useState(0);
  const [totalRicePaid, setTotalRicePaid] = useState(0);

  // Other expenses
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    loadBuyers();
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBuyers();
      loadAllData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAllData = async () => {
    await Promise.all([loadRiceTransactions(), loadExpenses()]);
  };

  const loadRiceTransactions = async () => {
    try {
      let revenue = 0;
      let paid = 0;
      const allTransactions: any[] = [];

      const allBuyers = await db.getAllBuyers();

      for (const buyer of allBuyers) {
        const sellers = await db.getSellersByBuyerId(buyer.id);

        for (const seller of sellers) {
          const sellerTransactions = await db.getTransactionsBySellerId(
            seller.id,
          );

          for (const transaction of sellerTransactions) {
            const actualWeight = Math.max(
              (transaction.totalWeight || 0) -
                (transaction.subtractWeight || 0),
              0,
            );
            const transactionRevenue =
              actualWeight * (transaction.pricePerKg || 0);
            const transactionPaid =
              (transaction.deposit || 0) + (transaction.paid || 0);

            revenue += transactionRevenue;
            paid += transactionPaid;

            allTransactions.push({
              id: transaction.id,
              type: 'rice',
              buyerName: buyer.name,
              sellerName: seller.name,
              date: transaction.date,
              bags: transaction.totalBags || 0,
              weight: transaction.totalWeight || 0,
              amount: transactionRevenue,
              paid: transactionPaid,
              remaining: transactionRevenue - transactionPaid,
            });
          }
        }
      }

      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });

      setTotalRiceRevenue(revenue);
      setTotalRicePaid(paid);
      setRiceTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading rice transactions:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const allExpenses = await db.getAllExpenses();

      let income = 0;
      let expense = 0;

      allExpenses.forEach((exp: any) => {
        if (exp.type === 'income') {
          income += exp.amount;
        } else {
          expense += exp.amount;
        }
      });

      setExpenses(allExpenses);
      setTotalIncome(income);
      setTotalExpense(expense);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBuyers();
    await loadAllData();
    setRefreshing(false);
  };

  const handleAddExpense = async (
    type: 'income' | 'expense',
    category: string,
    amount: number,
    description: string,
  ) => {
    try {
      await db.addExpense({
        id: Date.now().toString(),
        type,
        category,
        amount,
        description,
        date: new Date().toLocaleDateString('vi-VN'),
      });
      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Lỗi', 'Không thể thêm khoản thu chi');
    }
  };

  const handleDeleteExpense = (expense: any) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa khoản ${
        expense.type === 'income' ? 'thu' : 'chi'
      } "${expense.category}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteExpense(expense.id);
              await loadExpenses();
            } catch (error) {
              console.error('Error deleting expense:', error);
            }
          },
        },
      ],
    );
  };

  // Calculate totals
  const totalRevenue = totalRiceRevenue + totalIncome;
  const totalCost = totalExpense; // Only expenses, not rice payments
  const totalProfit = totalRevenue - totalRicePaid - totalCost;

  // Combine and filter data
  const allItems = [
    ...riceTransactions,
    ...expenses.map(exp => ({
      ...exp,
      type: exp.type === 'income' ? 'income' : 'expense',
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'rice') return item.type === 'rice';
    if (activeTab === 'income') return item.type === 'income';
    if (activeTab === 'expense') return item.type === 'expense';
    return true;
  });

  // Pie chart data - Income
  const incomeChartData = [
    {
      text: 'Thu lúa',
      value: totalRiceRevenue,
      color: '#10B981',
    },
    {
      text: 'Thu khác',
      value: totalIncome,
      color: '#3B82F6',
    },
  ].filter(item => item.value > 0);

  // Pie chart data - Expense (only from expenses table)
  const expenseChartData = expenses
    .filter(exp => exp.type === 'expense')
    .reduce((acc: any[], exp) => {
      const existing = acc.find(item => item.text === exp.category);
      if (existing) {
        existing.value += exp.amount;
      } else {
        acc.push({
          text: exp.category,
          value: exp.amount,
          color: ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'][acc.length % 4],
        });
      }
      return acc;
    }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💰</Text>
        <Text style={styles.headerTitle}>Thu Chi</Text>
        <Text style={styles.headerSubtitle}>Quản lý tài chính chi tiết</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryItem, styles.revenueItem]}>
              <Text style={styles.summaryLabel}>Tổng thu</Text>
              <Text style={[styles.summaryValue, styles.revenueValue]}>
                {totalRevenue.toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={[styles.summaryItem, styles.expenseItem]}>
              <Text style={styles.summaryLabel}>Tổng chi</Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                {totalCost.toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Lãi ròng</Text>
            <Text style={styles.profitValue}>
              {totalProfit.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Income Pie Chart */}
        {incomeChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>💵 Cơ cấu thu nhập</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={incomeChartData}
                radius={70}
                innerRadius={35}
                strokeColor="white"
                strokeWidth={2}
                showGradient
                focusOnPress
                toggleFocusOnPress={false}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelTitle}>Tổng</Text>
                    <Text style={styles.centerLabelValue}>
                      {(totalRevenue / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                )}
              />
            </View>
            {/* Compact Legend */}
            <View style={styles.compactLegend}>
              {incomeChartData.map((item, index) => (
                <View key={index} style={styles.compactLegendItem}>
                  <View style={[styles.compactDot, { backgroundColor: item.color }]} />
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactTitle}>{item.text}</Text>
                    <Text style={styles.compactValue}>
                      {item.value.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <Text style={styles.compactPercent}>
                    {((item.value / totalRevenue) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Expense Pie Chart */}
        {expenseChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>💸 Cơ cấu chi tiêu</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={expenseChartData}
                radius={70}
                innerRadius={35}
                strokeColor="white"
                strokeWidth={2}
                showGradient
                focusOnPress
                toggleFocusOnPress={false}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelTitle}>Tổng</Text>
                    <Text style={styles.centerLabelValue}>
                      {(totalCost / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                )}
              />
            </View>
            {/* Compact Legend */}
            <View style={styles.compactLegend}>
              {expenseChartData.map((item, index) => (
                <View key={index} style={styles.compactLegendItem}>
                  <View style={[styles.compactDot, { backgroundColor: item.color }]} />
                  <View style={styles.compactInfo}>
                    <Text style={styles.compactTitle}>{item.text}</Text>
                    <Text style={styles.compactValue}>
                      {item.value.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                  <Text style={styles.compactPercent}>
                    {((item.value / totalCost) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rice' && styles.activeTab]}
            onPress={() => setActiveTab('rice')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'rice' && styles.activeTabText,
              ]}
            >
              Mua lúa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'income' && styles.activeTab]}
            onPress={() => setActiveTab('income')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'income' && styles.activeTabText,
              ]}
            >
              Thu khác
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'expense' && styles.activeTab]}
            onPress={() => setActiveTab('expense')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'expense' && styles.activeTabText,
              ]}
            >
              Chi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        ) : (
          filteredItems.map(item => {
            if (item.type === 'rice') {
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>🌾 Mua lúa</Text>
                      <Text style={styles.itemSubtitle}>
                        {item.buyerName} ← {item.sellerName}
                      </Text>
                    </View>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>Mua lúa</Text>
                    </View>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDate}>📅 {item.date}</Text>
                    <Text style={styles.itemStats}>
                      {item.bags} bao •{' '}
                      {item.weight.toLocaleString('vi-VN', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      kg
                    </Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemAmount}>
                      {item.amount.toLocaleString('vi-VN')} đ
                    </Text>
                    {item.remaining > 0 && (
                      <Text style={styles.itemRemaining}>
                        Còn nợ: {item.remaining.toLocaleString('vi-VN')} đ
                      </Text>
                    )}
                  </View>
                </View>
              );
            } else {
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>
                        {item.type === 'income' ? '📈' : '📉'} {item.category}
                      </Text>
                      {item.description && (
                        <Text style={styles.itemSubtitle}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(item)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDate}>📅 {item.date}</Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <Text
                      style={[
                        styles.itemAmount,
                        item.type === 'income'
                          ? styles.incomeAmount
                          : styles.expenseAmount,
                      ]}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {item.amount.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>
              );
            }
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddExpense}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueItem: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  expenseItem: {},
  summaryLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  revenueValue: {
    color: '#10B981',
  },
  expenseValue: {
    color: '#EF4444',
  },
  profitCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelTitle: {
    fontSize: 10,
    color: colors.text.light,
    marginBottom: 2,
    fontWeight: '500',
  },
  centerLabelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },
  compactLegend: {
    width: '100%',
  },
  compactLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  compactPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 35,
    textAlign: 'right',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  itemBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  itemStats: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  incomeAmount: {
    color: '#10B981',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  itemRemaining: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: '300',
  },
});
