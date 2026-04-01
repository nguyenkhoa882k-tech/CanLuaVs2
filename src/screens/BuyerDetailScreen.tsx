import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { StatCard } from '../components/StatCard';
import { AddSellerModal } from '../components/AddSellerModal';
import { CustomModal } from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import { useStore } from '../store/useStore';
import * as db from '../services/database';

export const BuyerDetailScreen = ({ route, navigation }: any) => {
  const { buyer } = route.params;
  const { sellers, addSeller, deleteSeller, loadSellers } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBags, setTotalBags] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [sellerStats, setSellerStats] = useState<{
    [key: string]: { bags: number; weight: number };
  }>({});
  
  const deleteModal = useModal();
  const [sellerToDelete, setSellerToDelete] = useState<any>(null);

  // Load sellers when screen mounts or when screen comes into focus
  useEffect(() => {
    loadSellers(buyer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer.id]);

  // Reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSellers(buyer.id);
    });

    return unsubscribe;
  }, [navigation, buyer.id, loadSellers]);

  // Filter sellers for this buyer
  const buyerSellers = useMemo(
    () => sellers.filter((s: any) => s.buyerId === buyer.id),
    [sellers, buyer.id],
  );

  // Calculate total bags and weight from all sellers' transactions
  useEffect(() => {
    const calculateTotals = async () => {
      let bags = 0;
      let weight = 0;
      const stats: { [key: string]: { bags: number; weight: number } } = {};

      for (const seller of buyerSellers) {
        let sellerBags = 0;
        let sellerWeight = 0;

        try {
          const transactions = await db.getTransactionsBySellerId(seller.id);

          for (const transaction of transactions) {
            // Use pre-calculated values from database
            sellerBags += transaction.totalBags || 0;
            sellerWeight += transaction.totalWeight || 0;
            bags += transaction.totalBags || 0;
            weight += transaction.totalWeight || 0;
          }

          stats[seller.id] = { bags: sellerBags, weight: sellerWeight };
        } catch (error) {
          console.error(
            'Error calculating totals for seller:',
            seller.id,
            error,
          );
          stats[seller.id] = { bags: 0, weight: 0 };
        }
      }

      setTotalBags(bags);
      setTotalWeight(weight);
      setSellerStats(stats);
    };

    if (buyerSellers.length > 0) {
      calculateTotals();
    } else {
      setTotalBags(0);
      setTotalWeight(0);
      setSellerStats({});
    }
  }, [buyerSellers]);

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
    deleteModal.hideModal();
  };

  const confirmDeleteSeller = (seller: any) => {
    setSellerToDelete(seller);
    deleteModal.showModal({
      title: 'Xác nhận xóa',
      icon: 'delete-alert',
      iconColor: colors.error,
    });
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSellers(buyer.id);
    setRefreshing(false);
  };

  // Mock data for stats
  const totalSellers = buyerSellers.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.buyerName}>{buyer.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSellers}</Text>
              <Text style={styles.statLabel}>Người bán</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalBags}</Text>
              <Text style={styles.statLabel}>Tổng bao</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalWeight.toLocaleString('vi-VN', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </Text>
              <Text style={styles.statLabel}>Tổng kg</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sellers List */}
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
        {buyerSellers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Chưa có người bán nào</Text>
            <Text style={styles.emptySubtext}>
              Nhấn nút + bên dưới để thêm người bán mới
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Danh sách người bán ({buyerSellers.length})
            </Text>
            {buyerSellers.map((seller: any) => {
              const stats = sellerStats[seller.id] || { bags: 0, weight: 0 };
              return (
                <TouchableOpacity
                  key={seller.id}
                  style={styles.sellerCard}
                  onPress={() =>
                    navigation.navigate('Weighing', { seller, buyer })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.sellerCardHeader}>
                    <View style={styles.sellerNameContainer}>
                      <View style={styles.sellerAvatar}>
                        <Text style={styles.sellerAvatarText}>
                          {seller.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.sellerInfo}>
                        <Text style={styles.sellerName}>{seller.name}</Text>
                        <Text style={styles.sellerDate}>📅 {seller.date}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={e => {
                        e.stopPropagation();
                        confirmDeleteSeller(seller);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sellerStatsContainer}>
                    <View style={styles.sellerStatBox}>
                      <Text style={styles.sellerStatLabel}>Đơn giá</Text>
                      <Text style={styles.sellerStatValue}>
                        {seller.price.toLocaleString('vi-VN')} đ/kg
                      </Text>
                    </View>
                    <View style={styles.sellerStatBox}>
                      <Text style={styles.sellerStatLabel}>Số bao</Text>
                      <Text style={styles.sellerStatValue}>{stats.bags}</Text>
                    </View>
                    <View style={styles.sellerStatBox}>
                      <Text style={styles.sellerStatLabel}>Tổng kg</Text>
                      <Text style={styles.sellerStatValue}>
                        {stats.weight.toLocaleString('vi-VN', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sellerCardFooter}>
                    <Text style={styles.viewDetailsText}>Xem chi tiết →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
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

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModal.visible}
        onClose={deleteModal.hideModal}
        icon="delete-alert"
        iconColor={colors.error}
        title="Xác nhận xóa"
        message={
          sellerToDelete
            ? `Bạn có chắc muốn xóa người bán "${sellerToDelete.name}"?\n\n` +
              `Thông tin:\n` +
              `• Đơn giá: ${sellerToDelete.price.toLocaleString('vi-VN')} đ/kg\n` +
              `• Số bao: ${(sellerStats[sellerToDelete.id]?.bags || 0)}\n` +
              `• Tổng kg: ${(sellerStats[sellerToDelete.id]?.weight || 0).toLocaleString('vi-VN', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}\n\n` +
              `Dữ liệu sẽ được lưu trữ và có thể khôi phục sau.`
            : ''
        }
        buttons={[
          {
            text: 'Hủy',
            onPress: deleteModal.hideModal,
            style: 'cancel',
          },
          {
            text: 'Xóa',
            onPress: () => sellerToDelete && handleDeleteSeller(sellerToDelete.id),
            style: 'destructive',
          },
        ]}
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
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 22,
    color: colors.white,
    marginRight: 6,
  },
  backText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  headerInfo: {
    gap: 12,
  },
  buyerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  sellerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  sellerDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  sellerStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sellerStatBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  sellerStatLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  sellerStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sellerCardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    color: colors.primary,
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
