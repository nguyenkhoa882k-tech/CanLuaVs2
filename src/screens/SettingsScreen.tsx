import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Platform,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNShare from 'react-native-share';
import * as db from '../services/database';
import { CustomModal } from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import { DataManagementModal } from '../components/DataManagementModal';
import { useRewardedAd } from '../hooks/useRewardedAd';

interface SettingItemProps {
  iconName: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  iconName,
  iconColor = colors.primary,
  title,
  subtitle,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  isLast,
}) => {
  const content = (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}
        >
          <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      )}
      {!hasSwitch && onPress && (
        <Icon name="chevron-right" size={24} color={colors.text.light} />
      )}
    </View>
  );

  if (onPress && !hasSwitch) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const [showDataModal, setShowDataModal] = React.useState(false);
  const [dataModalMode, setDataModalMode] = React.useState<'export' | 'import'>(
    'export',
  );

  // Rewarded Ad Hook
  const { loaded: rewardedAdLoaded, showAd: showRewardedAd } = useRewardedAd();

  const modal = useModal();
  const successModal = useModal();
  const errorModal = useModal();
  const exportChoiceModal = useModal();

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // Android 13+ không cần quyền storage cho scoped storage
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Quyền truy cập bộ nhớ',
            message: 'Ứng dụng cần quyền để lưu file sao lưu',
            buttonPositive: 'Đồng ý',
            buttonNegative: 'Hủy',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleExportData = () => {
    // Show choice modal: Normal export or Rewarded export
    exportChoiceModal.showModal({
      title: 'Xuất dữ liệu',
      message: 'Chọn cách xuất dữ liệu:',
      icon: 'database-export',
      iconColor: colors.primary,
      buttons: [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Xuất thường',
          onPress: () => {
            setDataModalMode('export');
            setShowDataModal(true);
          },
          style: 'default',
        },
        {
          text: '🎁 Xem video → Xuất nhanh',
          onPress: () => handleRewardedExport(),
          style: 'primary',
        },
      ],
    });
  };

  const handleRewardedExport = async () => {
    if (!rewardedAdLoaded) {
      errorModal.showModal({
        title: 'Chưa sẵn sàng',
        message: 'Video đang tải, vui lòng thử lại sau.',
        icon: 'alert-circle',
        iconColor: colors.warning,
      });
      return;
    }

    // Show rewarded ad
    const earned = await showRewardedAd();

    if (earned) {
      // User watched full video → Export directly
      await exportToFile();
    } else {
      // User didn't watch full video
      errorModal.showModal({
        title: 'Chưa hoàn thành',
        message: 'Vui lòng xem hết video để xuất dữ liệu nhanh.',
        icon: 'alert-circle',
        iconColor: colors.warning,
      });
    }
  };

  const handleImportData = () => {
    setDataModalMode('import');
    setShowDataModal(true);
  };

  const exportToFile = async () => {
    try {
      // Request permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        errorModal.showModal({
          title: 'Lỗi',
          message: 'Cần quyền truy cập bộ nhớ để xuất dữ liệu',
          icon: 'alert-circle',
          iconColor: colors.error,
        });
        return;
      }

      // Get all data from database
      const buyers = await db.getAllBuyers();
      const allTransactions = await db.getAllTransactions();
      const allExpenses = await db.getAllExpenses();

      // Get sellers for each buyer
      const sellersData = [];
      for (const buyer of buyers) {
        const sellers = await db.getSellersByBuyerId(buyer.id);
        sellersData.push(...sellers);
      }

      // Create backup object
      const backupData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          buyers,
          sellers: sellersData,
          transactions: allTransactions,
          expenses: allExpenses,
        },
      };

      // Create filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      const filename = `CanLua_Backup_${timestamp}.json`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filepath = `${dirs.DownloadDir}/${filename}`;

      // Write file
      await ReactNativeBlobUtil.fs.writeFile(
        filepath,
        JSON.stringify(backupData, null, 2),
        'utf8',
      );

      // Scan file to make it visible in File Manager (Android)
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: filename,
            parentFolder: 'Download',
            mimeType: 'application/json',
          },
          'Download',
          filepath,
        );
      }

      successModal.showModal({
        title: 'Lưu thành công',
        message: `File đã được lưu vào:\n\nDownloads/${filename}\n\nMở ứng dụng "Files" hoặc "Quản lý file" để xem file.`,
        icon: 'check-circle',
        iconColor: colors.success,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      errorModal.showModal({
        title: 'Lỗi',
        message: `Không thể xuất dữ liệu: ${error.message}`,
        icon: 'alert-circle',
        iconColor: colors.error,
      });
    }
  };

  const exportAndShare = async () => {
    try {
      // Request permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        errorModal.showModal({
          title: 'Lỗi',
          message: 'Cần quyền truy cập bộ nhớ để xuất dữ liệu',
          icon: 'alert-circle',
          iconColor: colors.error,
        });
        return;
      }

      // Get all data from database
      const buyers = await db.getAllBuyers();
      const allTransactions = await db.getAllTransactions();
      const allExpenses = await db.getAllExpenses();

      // Get sellers for each buyer
      const sellersData = [];
      for (const buyer of buyers) {
        const sellers = await db.getSellersByBuyerId(buyer.id);
        sellersData.push(...sellers);
      }

      // Create backup object
      const backupData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          buyers,
          sellers: sellersData,
          transactions: allTransactions,
          expenses: allExpenses,
        },
      };

      // Create filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      const filename = `CanLua_Backup_${timestamp}.json`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filepath = `${dirs.DownloadDir}/${filename}`;

      // Write file to Downloads
      await ReactNativeBlobUtil.fs.writeFile(
        filepath,
        JSON.stringify(backupData, null, 2),
        'utf8',
      );

      // Make file visible in File Manager (Android)
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: filename,
            parentFolder: 'Download',
            mimeType: 'application/json',
          },
          'Download',
          filepath,
        );
      }

      // Share file using react-native-share
      try {
        // For sharing, we need to copy file to cache directory
        // because Downloads folder may not be accessible
        const cacheFilePath = `${dirs.CacheDir}/${filename}`;
        await ReactNativeBlobUtil.fs.cp(filepath, cacheFilePath);

        const shareOptions = {
          title: 'Sao lưu dữ liệu Cân Lúa',
          message: `Sao lưu dữ liệu Cân Lúa - ${new Date().toLocaleDateString(
            'vi-VN',
          )}`,
          url: `file://${cacheFilePath}`,
          type: 'application/json',
          filename: filename,
          subject: 'Sao lưu dữ liệu Cân Lúa', // for email
          failOnCancel: false,
        };

        const result = await RNShare.open(shareOptions);

        // Clean up cache file after sharing
        setTimeout(() => {
          ReactNativeBlobUtil.fs.unlink(cacheFilePath).catch(() => {});
        }, 5000);

        if (result.success) {
          successModal.showModal({
            title: 'Chia sẻ thành công',
            message: `File đã được lưu vào Downloads/${filename}\n\nVà đã chia sẻ thành công.`,
            icon: 'check-circle',
            iconColor: colors.success,
          });
        }
      } catch (shareError: any) {
        console.error('Share error:', shareError);
        // If user cancelled or error, file is still saved
        if (
          shareError.message &&
          !shareError.message.includes('User did not share')
        ) {
          successModal.showModal({
            title: 'Đã lưu file',
            message: `File đã được lưu vào:\n\nDownloads/${filename}\n\nBạn có thể mở File Manager để chia sẻ file này qua Zalo, Email, v.v.`,
            icon: 'check-circle',
            iconColor: colors.success,
          });
        }
      }
    } catch (error: any) {
      console.error('Export error:', error);
      errorModal.showModal({
        title: 'Lỗi',
        message: `Không thể xuất dữ liệu: ${error.message}`,
        icon: 'alert-circle',
        iconColor: colors.error,
      });
    }
  };

  const performImport = async (filepath: string) => {
    try {
      // Read file
      const fileContent = await ReactNativeBlobUtil.fs.readFile(
        filepath,
        'utf8',
      );
      const backupData = JSON.parse(fileContent);

      // Validate structure
      if (!backupData.version || !backupData.data) {
        throw new Error('File sao lưu không hợp lệ');
      }

      const { buyers, sellers, transactions, expenses } = backupData.data;

      // Clear existing data
      await db.clearAllData();

      // Import buyers
      if (buyers && Array.isArray(buyers)) {
        for (const buyer of buyers) {
          await db.addBuyer({
            id: buyer.id,
            name: buyer.name,
            phone: buyer.phone || '',
            category: buyer.category,
            vehicleNumber: buyer.vehicleNumber,
          });
        }
      }

      // Import sellers
      if (sellers && Array.isArray(sellers)) {
        for (const seller of sellers) {
          await db.addSeller({
            id: seller.id,
            buyerId: seller.buyerId,
            name: seller.name,
            productName: seller.productName,
            price: seller.price,
            date: seller.date,
          });
        }
      }

      // Import transactions
      if (transactions && Array.isArray(transactions)) {
        for (const transaction of transactions) {
          await db.addTransaction({
            id: transaction.id,
            sellerId: transaction.seller_id || transaction.sellerId,
            subtractWeight:
              transaction.subtract_weight || transaction.subtractWeight || 0,
            actualWeight:
              transaction.actual_weight || transaction.actualWeight || 0,
            pricePerKg: transaction.price_per_kg || transaction.pricePerKg || 0,
            deposit: transaction.deposit || 0,
            paid: transaction.paid || 0,
            bagData: transaction.bag_data || transaction.bagData || '',
            totalBags: transaction.total_bags || transaction.totalBags || 0,
            totalWeight:
              transaction.total_weight || transaction.totalWeight || 0,
            date: transaction.date,
            tareMode: transaction.tare_mode || transaction.tareMode || 'auto',
            tareBagsPerKg:
              transaction.tare_bags_per_kg || transaction.tareBagsPerKg || 8,
            inputDigits:
              transaction.input_digits || transaction.inputDigits || 3,
            inputFormat:
              transaction.input_format || transaction.inputFormat || 'odd',
            impurityWeight:
              transaction.impurity_weight || transaction.impurityWeight || 0,
          });
        }
      }

      // Import expenses
      if (expenses && Array.isArray(expenses)) {
        for (const expense of expenses) {
          await db.addExpense({
            id: expense.id,
            type: expense.type,
            category: expense.category,
            amount: expense.amount,
            description: expense.description || '',
            date: expense.date,
          });
        }
      }

      successModal.showModal({
        title: 'Nhập dữ liệu thành công',
        message: `Đã nhập:\n• ${buyers?.length || 0} người mua\n• ${
          sellers?.length || 0
        } người bán\n• ${transactions?.length || 0} giao dịch\n• ${
          expenses?.length || 0
        } thu chi`,
        icon: 'check-circle',
        iconColor: colors.success,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      errorModal.showModal({
        title: 'Lỗi nhập dữ liệu',
        message:
          error.message === 'File sao lưu không hợp lệ'
            ? 'File không đúng định dạng. Vui lòng chọn file sao lưu hợp lệ.'
            : `Không thể nhập dữ liệu: ${error.message}`,
        icon: 'alert-circle',
        iconColor: colors.error,
      });
      throw error;
    }
  };

  const handleImportFromFile = async (filepath: string) => {
    await performImport(filepath);
  };

  const handleExportAction = async (action: 'save' | 'share') => {
    if (action === 'save') {
      await exportToFile();
    } else {
      await exportAndShare();
    }
  };

  const handleDeleteAllData = () => {
    modal.showModal({
      title: 'Xác nhận xóa',
      message:
        'Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu?\n\nHành động này KHÔNG THỂ hoàn tác!',
      icon: 'alert',
      iconColor: colors.error,
      buttons: [
        { text: 'Hủy', onPress: () => {}, style: 'cancel' },
        {
          text: 'Xóa tất cả',
          onPress: async () => {
            try {
              await db.clearAllData();
              successModal.showModal({
                title: 'Thành công',
                message:
                  'Đã xóa tất cả dữ liệu. Vui lòng khởi động lại ứng dụng.',
                icon: 'check-circle',
                iconColor: colors.success,
              });
            } catch {
              errorModal.showModal({
                title: 'Lỗi',
                message: 'Không thể xóa dữ liệu',
                icon: 'alert-circle',
                iconColor: colors.error,
              });
            }
          },
          style: 'destructive',
        },
      ],
    });
  };

  const handleRateApp = () => {
    const playStoreUrl = 'market://details?id=com.canluavs2';
    const webUrl =
      'https://play.google.com/store/apps/details?id=com.canluavs2';

    Linking.canOpenURL(playStoreUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(playStoreUrl);
        } else {
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        modal.showModal({
          title: 'Đánh giá ứng dụng',
          message:
            'Cảm ơn bạn đã sử dụng Cân Lúa App!\n\nỨng dụng sẽ sớm có mặt trên Google Play Store.',
          icon: 'star',
          iconColor: colors.warning,
        });
      });
  };

  const handleEmailContact = () => {
    const email = 'khoa882k@gmail.com';
    const subject = 'Liên hệ về Cân Lúa App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          errorModal.showModal({
            title: 'Lỗi',
            message: 'Không thể mở ứng dụng email',
            icon: 'alert-circle',
            iconColor: colors.error,
          });
        }
      })
      .catch(() => {
        errorModal.showModal({
          title: 'Lỗi',
          message: 'Đã xảy ra lỗi khi mở email',
          icon: 'alert-circle',
          iconColor: colors.error,
        });
      });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Icon
          name="cog"
          size={32}
          color={colors.white}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hướng dẫn sử dụng Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="book-open-variant" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Hướng dẫn sử dụng</Text>
          </View>
          <SettingItem
            iconName="scale-balance"
            iconColor="#FF6B6B"
            title="Trừ bì"
            subtitle="Cách nhập trọng lượng bì cần trừ"
            onPress={() => navigation.navigate('TareSettings')}
          />
          <SettingItem
            iconName="format-list-numbered"
            iconColor="#4ECDC4"
            title="Quy cách nhập"
            subtitle="Cách nhập số liệu cân nặng"
            onPress={() => navigation.navigate('InputFormat')}
          />
          <SettingItem
            iconName="cog-outline"
            iconColor="#AA96DA"
            title="Cài đặt khác"
            subtitle="Các tùy chọn cài đặt bổ sung"
            onPress={() => navigation.navigate('OtherSettings')}
          />
        </View>

        {/* Quản lý dữ liệu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="database" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Quản lý dữ liệu</Text>
          </View>
          <SettingItem
            iconName="export"
            iconColor="#4CAF50"
            title="Xuất dữ liệu"
            subtitle="Sao lưu dữ liệu ra file"
            onPress={handleExportData}
          />
          <SettingItem
            iconName="import"
            iconColor="#2196F3"
            title="Nhập dữ liệu"
            subtitle="Khôi phục từ file sao lưu"
            onPress={handleImportData}
          />

          <SettingItem
            iconName="delete-forever"
            iconColor="#F44336"
            title="Xóa tất cả dữ liệu"
            subtitle="Xóa toàn bộ dữ liệu ứng dụng"
            onPress={handleDeleteAllData}
            isLast
          />
        </View>

        {/* Giới thiệu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="information" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              Ứng dụng Cân Lúa giúp bạn quản lý việc cân lúa một cách dễ dàng và
              chính xác. Ghi nhận khối lượng, theo dõi khách hàng, và quản lý dữ
              liệu hiệu quả.
            </Text>
          </View>
          <SettingItem
            iconName="email"
            iconColor="#EA4335"
            title="Liên hệ hỗ trợ"
            subtitle="khoa882k@gmail.com"
            onPress={handleEmailContact}
          />
          <SettingItem
            iconName="star"
            iconColor="#FBBC04"
            title="Đánh giá ứng dụng"
            subtitle="Chia sẻ trải nghiệm của bạn"
            onPress={handleRateApp}
          />
          <SettingItem
            iconName="file-document"
            iconColor="#34A853"
            title="Điều khoản sử dụng"
            subtitle="Xem điều khoản và chính sách"
            onPress={() => setShowTermsModal(true)}
            isLast
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Icon name="scale-balance" size={48} color={colors.primary} />
          <Text style={styles.appName}>Cân Lúa App</Text>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2026 Cân Lúa App</Text>
          <TouchableOpacity
            onPress={handleEmailContact}
            style={styles.contactButton}
            activeOpacity={0.7}
          >
            <Icon
              name="email"
              size={16}
              color={colors.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.contactButtonText}>
              Liên hệ: khoa882k@gmail.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Modals */}
      <CustomModal
        visible={modal.visible}
        onClose={modal.hideModal}
        title={modal.config.title}
        message={modal.config.message}
        icon={modal.config.icon}
        iconColor={modal.config.iconColor}
        buttons={modal.config.buttons}
      />

      <CustomModal
        visible={exportChoiceModal.visible}
        onClose={exportChoiceModal.hideModal}
        title={exportChoiceModal.config.title}
        message={exportChoiceModal.config.message}
        icon={exportChoiceModal.config.icon}
        iconColor={exportChoiceModal.config.iconColor}
        buttons={exportChoiceModal.config.buttons}
      />

      <CustomModal
        visible={successModal.visible}
        onClose={successModal.hideModal}
        title={successModal.config.title}
        message={successModal.config.message}
        icon={successModal.config.icon}
        iconColor={successModal.config.iconColor}
      />

      <CustomModal
        visible={errorModal.visible}
        onClose={errorModal.hideModal}
        title={errorModal.config.title}
        message={errorModal.config.message}
        icon={errorModal.config.icon}
        iconColor={errorModal.config.iconColor}
      />

      {/* Data Management Modal */}
      <DataManagementModal
        visible={showDataModal}
        onClose={() => setShowDataModal(false)}
        mode={dataModalMode}
        onExport={handleExportAction}
        onImport={handleImportFromFile}
      />

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Icon name="file-document" size={24} color={colors.primary} />
                <Text style={styles.modalTitle}>Điều khoản sử dụng</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.termsTitle}>1. Giới thiệu</Text>
              <Text style={styles.termsText}>
                Ứng dụng Cân Lúa được phát triển để hỗ trợ nông dân và thương
                lái quản lý việc cân lúa một cách hiệu quả.
              </Text>

              <Text style={styles.termsTitle}>2. Quyền sử dụng</Text>
              <Text style={styles.termsText}>
                Bạn được cấp quyền sử dụng ứng dụng này cho mục đích cá nhân và
                thương mại. Không được sao chép, phân phối lại hoặc bán ứng dụng
                này.
              </Text>

              <Text style={styles.termsTitle}>3. Dữ liệu người dùng</Text>
              <Text style={styles.termsText}>
                Tất cả dữ liệu được lưu trữ cục bộ trên thiết bị của bạn. Chúng
                tôi không thu thập hoặc chia sẻ dữ liệu cá nhân của bạn với bên
                thứ ba.
              </Text>

              <Text style={styles.termsTitle}>4. Trách nhiệm</Text>
              <Text style={styles.termsText}>
                Người dùng chịu trách nhiệm về tính chính xác của dữ liệu nhập
                vào. Chúng tôi không chịu trách nhiệm về bất kỳ tổn thất nào
                phát sinh từ việc sử dụng ứng dụng.
              </Text>

              <Text style={styles.termsTitle}>5. Cập nhật</Text>
              <Text style={styles.termsText}>
                Chúng tôi có quyền cập nhật ứng dụng và điều khoản sử dụng bất
                cứ lúc nào. Người dùng nên kiểm tra thường xuyên để cập nhật
                thông tin mới nhất.
              </Text>

              <Text style={styles.termsTitle}>6. Liên hệ</Text>
              <Text style={styles.termsText}>
                Nếu có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên
                hệ: khoa882k@gmail.com
              </Text>

              <Text style={styles.termsFooter}>
                Cập nhật lần cuối: Tháng 3, 2026
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: colors.text.light,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  termsFooter: {
    fontSize: 12,
    color: colors.text.light,
    fontStyle: 'italic',
    marginTop: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
