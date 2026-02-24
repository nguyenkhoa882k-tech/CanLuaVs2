import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  hasSwitch,
  switchValue,
  onSwitchChange,
}) => {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
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
    </View>
  );
};

export const SettingsScreen = () => {
  const [autoBackup, setAutoBackup] = React.useState(false);
  const [deleteBackup, setDeleteBackup] = React.useState(false);
  const [bluetooth, setBluetooth] = React.useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚙️</Text>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Top người mua Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Top người mua</Text>
          <SettingItem
            icon="👤"
            title="-Xuất dữ liệu"
            subtitle="Sao lưu dữ liệu của file"
          />
          <SettingItem
            icon="👤"
            title="Nhập dữ liệu"
            subtitle="Khôi phục từ file sao lưu"
          />
          <SettingItem
            icon="🗑️"
            title="Xóa tất cả dữ liệu"
            subtitle="Xóa toàn bộ dữ liệu dùng"
          />
        </View>

        {/* Quản lý dữ liệu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Quản lý dữ liệu</Text>
          <SettingItem
            icon="👤"
            title="-Xuất dữ liệu"
            subtitle="Sao lưu dữ liệu định kỳ"
            hasSwitch
            switchValue={autoBackup}
            onSwitchChange={setAutoBackup}
          />
          <SettingItem
            icon="👤"
            title="Nhập dữ liệu"
            subtitle="Khôi phục thời file sao lưu"
            hasSwitch
            switchValue={deleteBackup}
            onSwitchChange={setDeleteBackup}
          />
          <SettingItem
            icon="🔗"
            title="Kết nối cân Bluetooth"
            subtitle="Kết nối với cân điện tử"
            hasSwitch
            switchValue={bluetooth}
            onSwitchChange={setBluetooth}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2026 Cân Lúa App</Text>
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
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: colors.text.light,
  },
});
