import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';
import { AddBuyerModal } from '../components/AddBuyerModal';
import { CustomModal } from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import * as db from '../services/database';

export const HomeScreen = ({ navigation }: any) => {
  const { buyers, addBuyer, deleteBuyer, loadBuyers } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalBags, setTotalBags] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [buyerStats, setBuyerStats] = useState<{
    [key: string]: { sellers: number; bags: number; weight: number };
  }>({});
  
  const deleteModal = useModal();
  const [buyerToDelete, setBuyerToDelete] = useState<any>(null);

  useEffect(() => {
    loadBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBuyers();
    });

    return unsubscribe;
  }, [navigation, loadBuyers]);

  // Calculate totals from all buyers' sellers' transactions
  useEffect(() => {
    const calculateTotals = async () => {
      let bags = 0;
      let weight = 0;
      let sellers = 0;
      const stats: {
        [key: string]: { sellers: number; bags: number; weight: number };
      } = {};

      for (const buyer of buyers) {
        let buyerBags = 0;
        let buyerWeight = 0;
        let buyerSellers = 0;

        try {
          // Get all sellers for this buyer
          const buyerSellersList = await db.getSellersByBuyerId(buyer.id);
          buyerSellers = buyerSellersList.length;
          sellers += buyerSellers;

          // Get transactions for each seller
          for (const seller of buyerSellersList) {
            const transactions = await db.getTransactionsBySellerId(seller.id);

            for (const transaction of transactions) {
              buyerBags += transaction.totalBags || 0;
              buyerWeight += transaction.totalWeight || 0;
              bags += transaction.totalBags || 0;
              weight += transaction.totalWeight || 0;
            }
          }

          stats[buyer.id] = {
            sellers: buyerSellers,
            bags: buyerBags,
            weight: buyerWeight,
          };
        } catch (error) {
          console.error('Error calculating totals for buyer:', buyer.id, error);
          stats[buyer.id] = { sellers: 0, bags: 0, weight: 0 };
        }
      }

      setTotalBags(bags);
      setTotalWeight(weight);
      setTotalSellers(sellers);
      setBuyerStats(stats);
    };

    if (buyers.length > 0) {
      calculateTotals();
    } else {
      setTotalBags(0);
      setTotalWeight(0);
      setTotalSellers(0);
      setBuyerStats({});
    }
  }, [buyers]);

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

  const handleDeleteBuyer = async (buyerId: string) => {
    await deleteBuyer(buyerId);
    await loadBuyers();
    deleteModal.hideModal();
  };

  const confirmDeleteBuyer = (buyer: any) => {
    setBuyerToDelete(buyer);
    deleteModal.showModal({
      title: 'Xác nhận xóa',
      message: `Bạn có chắc muốn xóa người mua "${buyer.name}"?\n\nDữ liệu sẽ được lưu trữ và có thể khôi phục sau.`,
      icon: 'delete-alert',
      iconColor: colors.error,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBuyers();
    setRefreshing(false);
  };

  const handleBuyerPress = (buyer: any) => {
    navigation.navigate('BuyerDetail', { buyer });
  };

  // Filter buyers based on search query
  const filteredBuyers = buyers.filter((buyer: any) => {
    const query = searchQuery.toLowerCase();
    return (
      buyer.name.toLowerCase().includes(query) ||
      (buyer.phone && buyer.phone.includes(query))
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>⚖️</Text>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Cân Lúa</Text>
            <Text style={styles.headerSubtitle}>Quản lý mua bán lúa gạo</Text>
          </View>
        </View>

        {/* Stats in Header */}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên hoặc SDT..."
            placeholderTextColor={colors.text.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Buyers List */}
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
        {filteredBuyers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{searchQuery ? '🔍' : '👥'}</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Không tìm thấy người mua'
                : 'Chưa có người mua nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Nhấn nút + bên dưới để thêm người mua mới'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Danh sách người mua ({filteredBuyers.length})
            </Text>
            {filteredBuyers.map((buyer: any) => {
              const stats = buyerStats[buyer.id] || {
                sellers: 0,
                bags: 0,
                weight: 0,
              };
              return (
                <TouchableOpacity
                  key={buyer.id}
                  style={styles.buyerCard}
                  onPress={() => handleBuyerPress(buyer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buyerCardHeader}>
                    <View style={styles.buyerNameContainer}>
                      <View style={styles.buyerAvatar}>
                        <Text style={styles.buyerAvatarText}>
                          {buyer.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.buyerInfo}>
                        <Text style={styles.buyerName}>{buyer.name}</Text>
                        {buyer.phone ? (
                          <Text style={styles.buyerPhone}>
                            📞 {buyer.phone}
                          </Text>
                        ) : (
                          <Text style={styles.buyerNoPhone}>Chưa có SĐT</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={e => {
                        e.stopPropagation();
                        confirmDeleteBuyer(buyer);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="delete" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buyerStatsContainer}>
                    <View style={styles.buyerStatBox}>
                      <Text style={styles.buyerStatLabel}>Người bán</Text>
                      <Text style={styles.buyerStatValue}>{stats.sellers}</Text>
                    </View>
                    <View style={styles.buyerStatBox}>
                      <Text style={styles.buyerStatLabel}>Số bao</Text>
                      <Text style={styles.buyerStatValue}>{stats.bags}</Text>
                    </View>
                    <View style={styles.buyerStatBox}>
                      <Text style={styles.buyerStatLabel}>Tổng kg</Text>
                      <Text style={styles.buyerStatValue}>
                        {stats.weight.toLocaleString('vi-VN', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.buyerCardFooter}>
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

      {/* Add Buyer Modal */}
      <AddBuyerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddBuyer}
      />

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModal.visible}
        onClose={deleteModal.hideModal}
        icon="delete-alert"
        iconColor={colors.error}
        title="Xác nhận xóa"
        message={
          buyerToDelete
            ? `Bạn có chắc muốn xóa người mua "${buyerToDelete.name}"?\n\nDữ liệu sẽ được lưu trữ và có thể khôi phục sau.`
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
            onPress: () => buyerToDelete && handleDeleteBuyer(buyerToDelete.id),
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
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
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
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 16,
    zIndex: 10,
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
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.text.light,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
  buyerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buyerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  buyerInfo: {
    flex: 1,
  },
  buyerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  buyerPhone: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  buyerNoPhone: {
    fontSize: 13,
    color: colors.text.light,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  buyerCardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    alignItems: 'center',
  },
  buyerStatsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  buyerStatBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  buyerStatLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  buyerStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
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
