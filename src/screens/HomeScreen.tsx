import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { StatCard } from '../components/StatCard';
import { AddBuyerModal } from '../components/AddBuyerModal';
import { useStore } from '../store/useStore';

export const HomeScreen = ({ navigation }: any) => {
  const {
    buyers,
    addBuyer,
    loadBuyers,
    totalWeight,
    totalBags,
    totalTransactions,
  } = useStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadBuyers();
  }, []);

  const handleAddBuyer = async (name: string, phone: string) => {
    const newBuyer = {
      id: Date.now().toString(),
      name,
      phone,
    };
    await addBuyer(newBuyer);
    // Reload buyers to get updated list from database
    await loadBuyers();
  };

  const handleBuyerPress = (buyer: any) => {
    navigation.navigate('BuyerDetail', { buyer });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerIcon}>⚖️</Text>
          <Text style={styles.headerTitle}>Cân Lúa</Text>
          <Text style={styles.headerSubtitle}>Quản lý mua bán lúa gạo</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc SDT..."
            placeholderTextColor={colors.text.light}
          />
          <Text style={styles.micIcon}>🎤</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard value={totalTransactions} label="Tổng ghe" />
        <StatCard value={totalBags} label="Tổng bao" />
        <StatCard value={`${totalWeight.toFixed(1)} kg`} label="Tổng kg" />
      </View>

      {/* Buyers List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {buyers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có người mua nào</Text>
            <Text style={styles.emptySubtext}>
              Nhấn nút + để thêm người mua mới
            </Text>
          </View>
        ) : (
          buyers.map(buyer => (
            <TouchableOpacity
              key={buyer.id}
              style={styles.buyerCard}
              onPress={() => handleBuyerPress(buyer)}
            >
              <View style={styles.buyerHeader}>
                <Text style={styles.buyerName}>{buyer.name}</Text>
                <TouchableOpacity>
                  <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
              </View>
              {buyer.phone ? (
                <Text style={styles.buyerPhone}>📞 {buyer.phone}</Text>
              ) : null}
              <View style={styles.buyerStats}>
                <Text style={styles.buyerStatsText}>0 giao dịch</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Buyer Modal */}
      <AddBuyerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddBuyer}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  micIcon: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.light,
  },
  buyerCard: {
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
  buyerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  buyerPhone: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  buyerStats: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  buyerStatsText: {
    fontSize: 13,
    color: colors.text.secondary,
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
