import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
  Platform,
  Modal,
  PermissionsAndroid,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useStore } from '../store/useStore';
import * as db from '../services/database';
import { useMMKVBoolean } from 'react-native-mmkv';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
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

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [autoBackup, setAutoBackup] = useMMKVBoolean('autoBackup');
  const [showTermsModal, setShowTermsModal] = React.useState(false);

  const inputDigits = useStore(state => state.inputDigits);
  const setInputDigits = useStore(state => state.setInputDigits);

  const handleAutoBackupToggle = (value: boolean) => {
    setAutoBackup(value);
    Alert.alert(
      value ? '✅ Đã bật' : '⚠️ Đã tắt',
      value
        ? 'Sao lưu tự động đã được bật. Dữ liệu sẽ được sao lưu định kỳ.'
        : 'Sao lưu tự động đã được tắt.'
    );
  };

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
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleExportData = async () => {
    // Show options first
    Alert.alert(
      '📤 Xuất dữ liệu',
      'Chọn cách xuất dữ liệu:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '💾 Lưu vào máy',
          onPress: () => exportToFile(),
        },
        {
          text: '📤 Chia sẻ',
          onPress: () => exportAndShare(),
        },
      ]
    );
  };

  const exportToFile = async () => {
    try {
      // Request permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Lỗi', 'Cần quyền truy cập bộ nhớ để xuất dữ liệu');
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `CanLua_Backup_${timestamp}.json`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filepath = `${dirs.DownloadDir}/${filename}`;

      // Write file
      await ReactNativeBlobUtil.fs.writeFile(
        filepath,
        JSON.stringify(backupData, null, 2),
        'utf8'
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
          filepath
        );
      }

      Alert.alert(
        '✅ Lưu thành công',
        `File đã được lưu vào:\n\nDownloads/${filename}\n\nMở ứng dụng "Files" hoặc "Quản lý file" để xem file.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Lỗi', `Không thể xuất dữ liệu: ${error.message}`);
    }
  };

  const exportAndShare = async () => {
    try {
      // Request permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Lỗi', 'Cần quyền truy cập bộ nhớ để xuất dữ liệu');
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
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `CanLua_Backup_${timestamp}.json`;
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const filepath = `${dirs.DownloadDir}/${filename}`;

      // Write file first
      await ReactNativeBlobUtil.fs.writeFile(
        filepath,
        JSON.stringify(backupData, null, 2),
        'utf8'
      );

      // Scan file to make it visible (Android)
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: filename,
            parentFolder: 'Download',
            mimeType: 'application/json',
          },
          'Download',
          filepath
        );
      }

      // Then share
      try {
        await Share.share({
          title: 'Sao lưu dữ liệu Cân Lúa',
          url: `file://${filepath}`,
          message: `Sao lưu dữ liệu Cân Lúa - ${new Date().toLocaleDateString('vi-VN')}`,
        });
      } catch (shareError) {
        console.error('Share error:', shareError);
        Alert.alert(
          '⚠️ Không thể chia sẻ',
          `File đã được lưu vào Downloads/${filename}\n\nNhưng không thể mở cửa sổ chia sẻ.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Lỗi', `Không thể xuất dữ liệu: ${error.message}`);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      '📂 Nhập dữ liệu',
      'Chức năng nhập dữ liệu sẽ được cập nhật trong phiên bản tiếp theo.\n\nHiện tại bạn có thể:\n• Xuất dữ liệu ra file JSON\n• Chia sẻ file qua email, Zalo\n• Lưu trữ an toàn',
      [{ text: 'Đóng' }]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      '⚠️ Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu?\n\nHành động này KHÔNG THỂ hoàn tác!',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.clearAllData();
              Alert.alert(
                '✅ Thành công',
                'Đã xóa tất cả dữ liệu. Vui lòng khởi động lại ứng dụng.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reload app or navigate to home
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa dữ liệu');
            }
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    const playStoreUrl = 'market://details?id=com.canluavs2';
    const webUrl = 'https://play.google.com/store/apps/details?id=com.canluavs2';

    Linking.canOpenURL(playStoreUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(playStoreUrl);
        } else {
          Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Alert.alert(
          '⭐ Đánh giá ứng dụng',
          'Cảm ơn bạn đã sử dụng Cân Lúa App!\n\nỨng dụng sẽ sớm có mặt trên Google Play Store.',
          [{ text: 'Đóng' }]
        );
      });
  };

  const handleEmailContact = () => {
    const email = 'khoa882k@gmail.com';
    const subject = 'Liên hệ về Cân Lúa App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Lỗi', 'Không thể mở ứng dụng email');
        }
      })
      .catch(() => Alert.alert('Lỗi', 'Đã xảy ra lỗi khi mở email'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Icon name="cog" size={32} color={colors.white} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cài đặt cân Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="scale-balance" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Cài đặt cân</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="numeric" size={24} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Số chữ số nhập</Text>
                <Text style={styles.settingSubtitle}>
                  {inputDigits === 3
                    ? '3 số (356 = 35.6kg)'
                    : '4 số (3567 = 356.7kg)'}
                </Text>
              </View>
            </View>
            <View style={styles.digitButtons}>
              <TouchableOpacity
                style={[
                  styles.digitButton,
                  inputDigits === 3 && styles.digitButtonActive,
                ]}
                onPress={() => setInputDigits(3)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.digitButtonText,
                    inputDigits === 3 && styles.digitButtonTextActive,
                  ]}
                >
                  3
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.digitButton,
                  inputDigits === 4 && styles.digitButtonActive,
                ]}
                onPress={() => setInputDigits(4)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.digitButtonText,
                    inputDigits === 4 && styles.digitButtonTextActive,
                  ]}
                >
                  4
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
            onPress={() => Alert.alert(
              'Quy cách nhập',
              'Chọn số chữ số nhập trong Cài đặt:\n\n• 3 số: 356 = 35.6kg\n• 4 số: 3567 = 356.7kg\n\nNhập số liệu vào các ô a, b, c, d, e.',
              [{ text: 'Đóng' }]
            )}
          />
          <SettingItem
            iconName="format-size"
            iconColor="#95E1D3"
            title="Kích cỡ chữ"
            subtitle="Điều chỉnh kích thước chữ hiển thị"
            onPress={() => Alert.alert(
              'Kích cỡ chữ',
              'Chức năng điều chỉnh kích thước chữ sẽ được cập nhật trong phiên bản tiếp theo.',
              [{ text: 'Đóng' }]
            )}
          />
          <SettingItem
            iconName="volume-high"
            iconColor="#F38181"
            title="Đọc số thành tiếng"
            subtitle="Nghe số liệu được đọc to"
            onPress={() => Alert.alert(
              'Đọc số thành tiếng',
              'Chức năng đọc số thành tiếng sẽ được cập nhật trong phiên bản tiếp theo.\n\nTính năng này sẽ đọc to số liệu khi bạn nhập.',
              [{ text: 'Đóng' }]
            )}
          />
          <SettingItem
            iconName="cog-outline"
            iconColor="#AA96DA"
            title="Cài đặt khác"
            subtitle="Các tùy chọn cài đặt bổ sung"
            onPress={() => Alert.alert(
              'Cài đặt khác',
              'Các cài đặt bổ sung:\n\n• Số chữ số nhập (3 hoặc 4)\n• Sao lưu tự động\n• Xuất/Nhập dữ liệu',
              [{ text: 'Đóng' }]
            )}
          />
          <SettingItem
            iconName="history"
            iconColor="#FCBAD3"
            title="Nhật ký"
            subtitle="Xem lịch sử thao tác"
            onPress={() => Alert.alert(
              'Nhật ký',
              'Chức năng nhật ký sẽ được cập nhật trong phiên bản tiếp theo.\n\nBạn sẽ có thể xem lịch sử các thao tác đã thực hiện.',
              [{ text: 'Đóng' }]
            )}
            isLast
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
            iconName="backup-restore"
            iconColor="#FF9800"
            title="Sao lưu tự động"
            subtitle="Sao lưu dữ liệu định kỳ"
            hasSwitch
            switchValue={autoBackup}
            onSwitchChange={handleAutoBackupToggle}
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
              Ứng dụng Cân Lúa giúp bạn quản lý việc cân lúa một cách dễ dàng và chính xác. 
              Ghi nhận khối lượng, theo dõi khách hàng, và quản lý dữ liệu hiệu quả.
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
            <Icon name="email" size={16} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.contactButtonText}>Liên hệ: khoa882k@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.termsTitle}>1. Giới thiệu</Text>
              <Text style={styles.termsText}>
                Ứng dụng Cân Lúa được phát triển để hỗ trợ nông dân và thương lái quản lý việc cân lúa một cách hiệu quả.
              </Text>

              <Text style={styles.termsTitle}>2. Quyền sử dụng</Text>
              <Text style={styles.termsText}>
                Bạn được cấp quyền sử dụng ứng dụng này cho mục đích cá nhân và thương mại. Không được sao chép, phân phối lại hoặc bán ứng dụng này.
              </Text>

              <Text style={styles.termsTitle}>3. Dữ liệu người dùng</Text>
              <Text style={styles.termsText}>
                Tất cả dữ liệu được lưu trữ cục bộ trên thiết bị của bạn. Chúng tôi không thu thập hoặc chia sẻ dữ liệu cá nhân của bạn với bên thứ ba.
              </Text>

              <Text style={styles.termsTitle}>4. Trách nhiệm</Text>
              <Text style={styles.termsText}>
                Người dùng chịu trách nhiệm về tính chính xác của dữ liệu nhập vào. Chúng tôi không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh từ việc sử dụng ứng dụng.
              </Text>

              <Text style={styles.termsTitle}>5. Cập nhật</Text>
              <Text style={styles.termsText}>
                Chúng tôi có quyền cập nhật ứng dụng và điều khoản sử dụng bất cứ lúc nào. Người dùng nên kiểm tra thường xuyên để cập nhật thông tin mới nhất.
              </Text>

              <Text style={styles.termsTitle}>6. Liên hệ</Text>
              <Text style={styles.termsText}>
                Nếu có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ: khoa882k@gmail.com
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
  digitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  digitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  digitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  digitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  digitButtonTextActive: {
    color: colors.white,
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
