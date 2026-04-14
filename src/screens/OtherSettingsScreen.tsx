import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useMMKVBoolean, useMMKVString } from 'react-native-mmkv';

interface OtherSettingsScreenProps {
  navigation: any;
}

export const OtherSettingsScreen: React.FC<OtherSettingsScreenProps> = ({
  navigation,
}) => {
  // Display settings - default to true
  const [showTotalInHeader = true, setShowTotalInHeader] = useMMKVBoolean(
    'display.showTotalInHeader',
  );
  const [showTotalWhenWeighing = true, setShowTotalWhenWeighing] =
    useMMKVBoolean('display.showTotalWhenWeighing');
  const [keepScreenOn = true, setKeepScreenOn] = useMMKVBoolean(
    'display.keepScreenOn',
  );
  const [showProductName, setShowProductName] = useMMKVBoolean(
    'display.showProductName',
  );
  const [showGroupCategory, setShowGroupCategory] = useMMKVBoolean(
    'display.showGroupCategory',
  );
  const [showVehicleNumber, setShowVehicleNumber] = useMMKVBoolean(
    'display.showVehicleNumber',
  );

  // Summary settings
  const [summaryMode = '75', setSummaryMode] = useMMKVString('summary.mode'); // '75' or '100'

  // Alert settings
  const [soundAlertOver5, setSoundAlertOver5] =
    useMMKVBoolean('alert.soundOver5');
  const [vibrateAlertOver5, setVibrateAlertOver5] =
    useMMKVBoolean('alert.vibrateOver5');

  // UI settings
  const [uiMode, setUiMode] = useMMKVString('ui.mode'); // 'simple' or 'full'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cài đặt khác</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Display Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="eye" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>CÀI ĐẶT HIỂN THỊ</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Tiêu đề tổng Ghe, Xe</Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị trong lượng tổng của Ghe, Xe trên thanh tiêu đề
              </Text>
            </View>
            <Switch
              value={showTotalInHeader}
              onValueChange={setShowTotalInHeader}
              trackColor={{ false: colors.border, true: '#FFC107' }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Tiêu đề tổng khi cân</Text>
              <Text style={styles.settingSubtitle}>
                Khởi lượng tổng sẽ hiện ở thanh tiêu đề khi nhập mã cân
              </Text>
            </View>
            <Switch
              value={showTotalWhenWeighing}
              onValueChange={setShowTotalWhenWeighing}
              trackColor={{ false: colors.border, true: '#FFC107' }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Giữ màn hình luôn sáng</Text>
              <Text style={styles.settingSubtitle}>
                Màn hình sẽ luôn sáng trong quá trình cân
              </Text>
            </View>
            <Switch
              value={keepScreenOn}
              onValueChange={setKeepScreenOn}
              trackColor={{ false: colors.border, true: '#FFC107' }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Hiển tên giống</Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị thêm tên hàng hóa (sản phẩm, giống)
              </Text>
            </View>
            <Switch
              value={showProductName || false}
              onValueChange={setShowProductName}
              trackColor={{ false: colors.border, true: colors.text.light }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Hiển phân loại (nhóm)</Text>
              <Text style={styles.settingSubtitle}>
                Nếu bạn muốn phân loại Xuất/Nhập cho nhóm, hãy bật nó lên.
              </Text>
            </View>
            <Switch
              value={showGroupCategory || false}
              onValueChange={setShowGroupCategory}
              trackColor={{ false: colors.border, true: colors.text.light }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                Hiển biển số Xe/Ghe (nhóm)
              </Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị biển số xe/ghe trong danh sách nhóm
              </Text>
            </View>
            <Switch
              value={showVehicleNumber || false}
              onValueChange={setShowVehicleNumber}
              trackColor={{ false: colors.border, true: colors.text.light }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Summary Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="calculator" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>CÀI ĐẶT TỔNG NHÓM</Text>
          </View>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setSummaryMode('75')}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {summaryMode === '75' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Nhóm 75 mã cân</Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị kết quả tổng của mỗi 75 mã cân
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setSummaryMode('100')}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {summaryMode === '100' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Nhóm 100 mã cân</Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị kết quả tổng của mỗi 100 mã cân
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Alert Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="bell" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>CÀI ĐẶT THÔNG BÁO</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Âm báo đủ 5 mã</Text>
              <Text style={styles.settingSubtitle}>
                Phần mềm sẽ phát âm thanh khi nhập đủ 5 mã cân
              </Text>
            </View>
            <Switch
              value={soundAlertOver5 || false}
              onValueChange={setSoundAlertOver5}
              trackColor={{ false: colors.border, true: '#FFC107' }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Rung báo đủ 5 mã</Text>
              <Text style={styles.settingSubtitle}>
                Phần mềm sẽ rung khi nhập đủ 5 mã cân
              </Text>
            </View>
            <Switch
              value={vibrateAlertOver5 || false}
              onValueChange={setVibrateAlertOver5}
              trackColor={{ false: colors.border, true: '#FFC107' }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* UI Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="monitor" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>CÀI ĐẶT GIAO DIỆN</Text>
          </View>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setUiMode('simple')}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {uiMode === 'simple' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Giao diện đơn giản</Text>
              <Text style={styles.settingSubtitle}>
                Chỉ hiển thị các phần cơ bản
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setUiMode('full')}
            activeOpacity={0.7}
          >
            <View style={styles.radioButton}>
              {uiMode === 'full' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Giao diện đầy đủ</Text>
              <Text style={styles.settingSubtitle}>
                Hiển thị tất cả các tính năng
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
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
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
