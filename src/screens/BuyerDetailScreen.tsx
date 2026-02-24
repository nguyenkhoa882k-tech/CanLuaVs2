import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { StatCard } from '../components/StatCard';
import { AddSellerModal } from '../components/AddSellerModal';
import { useStore } from '../store/useStore';

export const BuyerDetailScreen = ({ route, navigation }: any) => {
  const { buyer } = route.params;
  const { sellers, addSeller, deleteSeller, loadSellers } = useStore();
  const [modalVisible, setModalVisible] = useState(false);

  // Load sellers when screen mounts
  useEffect(() => {
    loadSellers(buyer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer.id]);

  // Filter sellers for this buyer
  const buyerSellers = sellers.filter((s: any) => s.buyerId === buyer.id);

  const handleAddSeller = async (name: string, price: number) => {
    const newSeller = {
      id: Date.now().toString(),
      buyerId: buyer.id,
      name,
      price,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    await addSeller(newSeller);
    // Reload sellers to get updated list from database
    await loadSellers(buyer.id);
  };

  const handleDeleteSeller = async (sellerId: string) => {
    await deleteSeller(sellerId);
    // Reload sellers to get updated list from database
    await loadSellers(buyer.id);
  };

  // Mock data for stats
  const totalSellers = buyerSellers.length;
  const totalBags = 0;
  const totalWeight = 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.buyerName}>{buyer.name}</Text>
            <Text style={styles.buyerSubtitle}>Quản lý người bán lúa</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard value={totalSellers} label="Người bán" />
        <StatCard value={totalBags} label="Tổng bao" />
        <StatCard value={`${totalWeight.toFixed(1)} kg`} label="Tổng kg" />
      </View>

      {/* Sellers List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {buyerSellers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có người bán nào</Text>
            <Text style={styles.emptySubtext}>
              Nhấn nút + để thêm người bán mới
            </Text>
          </View>
        ) : (
          buyerSellers.map((seller: any) => (
            <TouchableOpacity
              key={seller.id}
              style={styles.sellerCard}
              onPress={() => navigation.navigate('Weighing', { seller, buyer })}
            >
              <View style={styles.sellerHeader}>
                <Text style={styles.sellerName}>{seller.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={e => {
                    e.stopPropagation();
                    handleDeleteSeller(seller.id);
                  }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sellerDate}>📅 {seller.date}</Text>
              <View style={styles.sellerStats}>
                <Text style={styles.sellerPrice}>
                  {seller.price.toLocaleString('vi-VN')} đ/kg
                </Text>
                <Text style={styles.sellerStatsText}>0 giao dịch</Text>
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

      {/* Add Seller Modal */}
      <AddSellerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddSeller}
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
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
  },
  headerContent: {
    flex: 1,
  },
  buyerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  buyerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
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
  sellerCard: {
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
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  sellerDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  sellerStats: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sellerStatsText: {
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
