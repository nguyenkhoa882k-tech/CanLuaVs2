import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';
import * as db from '../services/database';

const screenWidth = Dimensions.get('window').width;

export const StatsScreen = ({ navigation }: any) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { buyers, loadBuyers } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [totalBags, setTotalBags] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [topBuyers, setTopBuyers] = useState<any[]>([]);

  useEffect(() => {
    loadBuyers();
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBuyers();
      calculateStats();
    });

    return unsubscribe;
  }, [navigation, selectedYear]);

  const calculateStats = async () => {
    try {
      let bags = 0;
      let weight = 0;
      let revenue = 0;
      let paid = 0;
      const monthly = Array(12).fill(0);
      const buyerData: any[] = [];

      const allBuyers = await db.getAllBuyers();

      for (const buyer of allBuyers) {
        let buyerWeight = 0;
        let buyerBags = 0;
        let buyerRevenue = 0;

        const sellers = await db.getSellersByBuyerId(buyer.id);

        for (const seller of sellers) {
          const transactions = await db.getTransactionsBySellerId(seller.id);

          for (const transaction of transactions) {
            // Parse date to check year
            const transactionDate = new Date(
              transaction.date.split('/').reverse().join('-'),
            );
            const transactionYear = transactionDate.getFullYear();
            const transactionMonth = transactionDate.getMonth();

            if (transactionYear === selectedYear) {
              const transactionBags = transaction.totalBags || 0;
              const transactionWeight = transaction.totalWeight || 0;

              bags += transactionBags;
              weight += transactionWeight;
              buyerBags += transactionBags;
              buyerWeight += transactionWeight;

              // Calculate revenue (actualWeight * pricePerKg)
              const actualWeight = Math.max(
                transactionWeight - (transaction.subtractWeight || 0),
                0,
              );
              const transactionRevenue =
                actualWeight * (transaction.pricePerKg || 0);
              revenue += transactionRevenue;
              buyerRevenue += transactionRevenue;
              paid += transaction.deposit || 0;
              paid += transaction.paid || 0;

              // Add to monthly data
              monthly[transactionMonth] += transactionWeight;
            }
          }
        }

        if (buyerWeight > 0) {
          buyerData.push({
            id: buyer.id,
            name: buyer.name,
            phone: buyer.phone,
            bags: buyerBags,
            weight: buyerWeight,
            revenue: buyerRevenue,
          });
        }
      }

      // Sort buyers by weight descending
      buyerData.sort((a, b) => b.weight - a.weight);

      setTotalBags(bags);
      setTotalWeight(weight);
      setTotalRevenue(revenue);
      setTotalPaid(paid);
      setTotalRemaining(revenue - paid);
      setMonthlyData(monthly);
      setTopBuyers(buyerData.slice(0, 5)); // Top 5
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBuyers();
    await calculateStats();
    setRefreshing(false);
  };

  const handleExportData = () => {
    Alert.alert(
      'Xuất dữ liệu',
      'Tính năng xuất dữ liệu sẽ được phát triển trong phiên bản tiếp theo.',
      [{ text: 'OK' }],
    );
  };

  const chartData = {
    labels: [
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
      'T6',
      'T7',
      'T8',
      'T9',
      'T10',
      'T11',
      'T12',
    ],
    datasets: [
      {
        data: monthlyData.length > 0 ? monthlyData : [0],
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>Thống kê</Text>
        <Text style={styles.headerSubtitle}>Tổng quan hoạt động</Text>
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
        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
            <Text style={styles.yearArrow}>← {selectedYear - 1}</Text>
          </TouchableOpacity>
          <Text style={styles.selectedYear}>{selectedYear}</Text>
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
            <Text style={styles.yearArrow}>{selectedYear + 1} →</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>⚖️</Text>
            <Text style={styles.summaryValue}>
              {totalWeight.toLocaleString('vi-VN', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </Text>
            <Text style={styles.summaryLabel}>Tổng kg</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📦</Text>
            <Text style={styles.summaryValue}>{totalBags}</Text>
            <Text style={styles.summaryLabel}>Tổng bao</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.revenueCard]}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={[styles.summaryValue, styles.revenueValue]}>
              {(totalRevenue / 1000000).toLocaleString('vi-VN', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              M
            </Text>
            <Text style={styles.summaryLabel}>Tổng tiền</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={[styles.summaryValue, styles.paidValue]}>
              {(totalPaid / 1000000).toLocaleString('vi-VN', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              M
            </Text>
            <Text style={styles.summaryLabel}>Đã trả</Text>
          </View>
        </View>

        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>Còn lại</Text>
          <Text style={styles.remainingValue}>
            {totalRemaining.toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Khối lượng theo tháng (kg)</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.primary,
              backgroundGradientFrom: colors.primary,
              backgroundGradientTo: colors.primaryDark,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.white,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Top Buyers */}
        <View style={styles.topBuyersContainer}>
          <Text style={styles.sectionTitle}>👥 Top người mua</Text>
          {topBuyers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            </View>
          ) : (
            topBuyers.map((buyer, index) => (
              <TouchableOpacity
                key={buyer.id}
                style={styles.topBuyerItem}
                onPress={() => navigation.navigate('BuyerDetail', { buyer })}
              >
                <View style={styles.topBuyerRank}>
                  <Text style={styles.topBuyerRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.topBuyerInfo}>
                  <View style={styles.topBuyerAvatar}>
                    <Text style={styles.topBuyerAvatarText}>
                      {buyer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.topBuyerDetails}>
                    <Text style={styles.topBuyerName}>{buyer.name}</Text>
                    <Text style={styles.topBuyerStats}>
                      {buyer.bags} bao •{' '}
                      {buyer.weight.toLocaleString('vi-VN', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      kg
                    </Text>
                  </View>
                </View>
                <Text style={styles.topBuyerRevenue}>
                  {(buyer.revenue / 1000000).toLocaleString('vi-VN', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  M
                </Text>
              </TouchableOpacity>
            ))
          )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  yearArrow: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  selectedYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  revenueCard: {
    backgroundColor: '#FEF3C7',
  },
  paidCard: {
    backgroundColor: '#D1FAE5',
  },
  revenueValue: {
    color: '#D97706',
  },
  paidValue: {
    color: '#059669',
  },
  remainingCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  remainingLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  topBuyersContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  topBuyerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBuyerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBuyerRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  topBuyerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBuyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBuyerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  topBuyerDetails: {
    flex: 1,
  },
  topBuyerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  topBuyerStats: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  topBuyerRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  exportButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  exportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
