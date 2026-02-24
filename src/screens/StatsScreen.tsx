import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';

const screenWidth = Dimensions.get('window').width;

export const StatsScreen = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const { totalWeight, totalBags } = useStore();

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
        data: [815, 406, 204, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.summaryIcon}>📦</Text>
            <Text style={styles.summaryValue}>{totalWeight.toFixed(1)} kg</Text>
            <Text style={styles.summaryLabel}>Tổng kg</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📦</Text>
            <Text style={styles.summaryValue}>{totalBags}</Text>
            <Text style={styles.summaryLabel}>Tổng bao</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>0</Text>
            <Text style={styles.summaryLabel}>Thu (đ)</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>0</Text>
            <Text style={styles.summaryLabel}>Chi (đ)</Text>
          </View>
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
          <View style={styles.topBuyerItem}>
            <View style={styles.topBuyerInfo}>
              <Text style={styles.topBuyerIcon}>👤</Text>
              <View>
                <Text style={styles.topBuyerName}>-Xuất dữ liệu</Text>
                <Text style={styles.topBuyerDetail}>
                  Sao lưu dữ liệu của file
                </Text>
              </View>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  topBuyerItem: {
    paddingVertical: 12,
  },
  topBuyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBuyerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  topBuyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  topBuyerDetail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
