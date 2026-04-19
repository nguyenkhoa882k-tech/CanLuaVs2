import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { CustomModal } from '../components/CustomModal';
import { useModal } from '../hooks/useModal';
import {
  getPremiumTier,
  setPremiumTier,
  PremiumTier,
  PREMIUM_TIERS,
} from '../services/premiumService';
import { validateActivationCode } from '../config/activationCodes';

interface ActivationScreenProps {
  navigation: any;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({
  navigation,
}) => {
  const [activationCode, setActivationCode] = useState('');
  const [currentTier, setCurrentTier] = useState<PremiumTier>(getPremiumTier());

  const successModal = useModal();
  const errorModal = useModal();

  const handleActivationSubmit = () => {
    if (!activationCode || activationCode.trim() === '') {
      errorModal.showModal({
        title: 'Lỗi',
        message: 'Vui lòng nhập mã kích hoạt',
        icon: 'alert-circle',
        iconColor: colors.error,
      });
      return;
    }

    // Validate activation code
    const result = validateActivationCode(activationCode);

    if (result.valid && result.tier) {
      setPremiumTier(result.tier);
      setCurrentTier(result.tier);
      setActivationCode('');

      const tierName =
        result.tier === 'tier1' ? 'Gói Nâng Cấp 1' : 'Gói Nâng Cấp 2';
      const limits = PREMIUM_TIERS[result.tier];

      successModal.showModal({
        title: 'Kích hoạt thành công! 🎉',
        message:
          `Tài khoản của bạn đã được nâng cấp lên ${tierName}\n\n` +
          `Giới hạn mới:\n` +
          `• Người mua: ${
            limits.maxBuyers === -1 ? 'Không giới hạn' : limits.maxBuyers
          }\n` +
          `• Người bán/mua: ${
            limits.maxSellersPerBuyer === -1
              ? 'Không giới hạn'
              : limits.maxSellersPerBuyer
          }`,
        icon: 'check-circle',
        iconColor: colors.success,
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              successModal.hideModal();
              navigation.goBack();
            },
            style: 'primary',
          },
        ],
      });
    } else {
      errorModal.showModal({
        title: 'Mã không hợp lệ',
        message:
          'Mã kích hoạt không đúng. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.',
        icon: 'alert-circle',
        iconColor: colors.error,
      });
    }
  };

  const getCurrentTierInfo = () => {
    const limits = PREMIUM_TIERS[currentTier];
    if (currentTier === 'free') {
      return {
        name: 'Miễn phí',
        color: colors.text.secondary,
        icon: 'account',
      };
    } else if (currentTier === 'tier1') {
      return {
        name: 'Gói Nâng Cấp 1',
        color: colors.primary,
        icon: 'crown',
      };
    } else {
      return {
        name: 'Gói Nâng Cấp 2',
        color: colors.warning,
        icon: 'crown',
      };
    }
  };

  const tierInfo = getCurrentTierInfo();
  const limits = PREMIUM_TIERS[currentTier];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhập mã kích hoạt</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Tier Info */}
        <View style={styles.currentTierCard}>
          <View style={styles.currentTierHeader}>
            <Icon name={tierInfo.icon} size={32} color={tierInfo.color} />
            <View style={styles.currentTierInfo}>
              <Text style={styles.currentTierLabel}>Gói hiện tại</Text>
              <Text style={[styles.currentTierName, { color: tierInfo.color }]}>
                {tierInfo.name}
              </Text>
            </View>
          </View>

          <View style={styles.limitsContainer}>
            <View style={styles.limitRow}>
              <Icon name="account" size={20} color={colors.text.secondary} />
              <Text style={styles.limitText}>
                Người mua:{' '}
                <Text style={styles.limitValue}>
                  {limits.maxBuyers === -1
                    ? 'Không giới hạn'
                    : limits.maxBuyers}
                </Text>
              </Text>
            </View>
            <View style={styles.limitRow}>
              <Icon
                name="account-group"
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.limitText}>
                Người bán/mua:{' '}
                <Text style={styles.limitValue}>
                  {limits.maxSellersPerBuyer === -1
                    ? 'Không giới hạn'
                    : limits.maxSellersPerBuyer}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Activation Form */}
        <View style={styles.activationCard}>
          <View style={styles.iconContainer}>
            <Icon name="key" size={64} color={colors.primary} />
          </View>

          <Text style={styles.title}>Nhập mã kích hoạt</Text>
          <Text style={styles.subtitle}>
            Nhập mã bạn đã nhận qua email để nâng cấp tài khoản
          </Text>

          <TextInput
            style={styles.input}
            placeholder="VD: CL1-A7K9-M2P4-X8Q1"
            placeholderTextColor={colors.text.light}
            value={activationCode}
            onChangeText={setActivationCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={19}
          />

          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivationSubmit}
          >
            <Icon name="check-circle" size={20} color={colors.white} />
            <Text style={styles.activateButtonText}>Kích hoạt</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>💡 Chưa có mã kích hoạt?</Text>
          <Text style={styles.helpText}>Để nhận mã kích hoạt, bạn cần:</Text>

          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Chọn gói nâng cấp và thanh toán
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Chụp ảnh biên lai và gửi email xác nhận
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Nhận mã kích hoạt qua email trong 24h
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Premium')}
          >
            <Icon name="crown" size={20} color={colors.primary} />
            <Text style={styles.upgradeButtonText}>Xem gói nâng cấp</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <Icon name="help-circle" size={24} color={colors.primary} />
          <Text style={styles.contactTitle}>Cần hỗ trợ?</Text>
          <Text style={styles.contactText}>
            Nếu bạn gặp vấn đề với mã kích hoạt, vui lòng liên hệ
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:khoa882k@gmail.com')}
          >
            <Icon name="email" size={18} color={colors.white} />
            <Text style={styles.contactButtonText}>khoa882k@gmail.com</Text>
          </TouchableOpacity>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Icon name="alert-circle" size={24} color={colors.error} />
            <Text style={styles.warningTitle}>⚠️ Lưu ý quan trọng</Text>
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningText}>
              • Gói nâng cấp được lưu trữ cục bộ trên thiết bị
            </Text>
            <Text style={styles.warningText}>
              • Nếu <Text style={styles.warningBold}>XÓA ỨNG DỤNG</Text>, tất cả
              dữ liệu nâng cấp sẽ bị mất
            </Text>
            <Text style={styles.warningText}>
              • Bạn sẽ phải{' '}
              <Text style={styles.warningBold}>MUA LẠI GÓI MỚI</Text> sau khi
              cài đặt lại
            </Text>
            <Text style={styles.warningText}>
              • Vui lòng <Text style={styles.warningBold}>SAO LƯU DỮ LIỆU</Text>{' '}
              thường xuyên
            </Text>
          </View>
          <View style={styles.warningFooter}>
            <Icon name="information" size={16} color={colors.text.secondary} />
            <Text style={styles.warningFooterText}>
              Chỉ xóa app khi thực sự cần thiết
            </Text>
          </View>
        </View>

        {/* Demo Codes */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>🎁 Mã demo để test:</Text>
          <Text style={styles.demoCode}>Gói 1: CL1-A7K9-M2P4-X8Q1</Text>
          <Text style={styles.demoCode}>Gói 2: CL2-M6G1-E8J4-K2X7</Text>
        </View>
      </ScrollView>

      {/* Success/Error Modals */}
      <CustomModal
        visible={successModal.visible}
        onClose={successModal.hideModal}
        icon={successModal.config.icon}
        iconColor={successModal.config.iconColor}
        title={successModal.config.title}
        message={successModal.config.message}
        buttons={successModal.config.buttons}
      />

      <CustomModal
        visible={errorModal.visible}
        onClose={errorModal.hideModal}
        icon={errorModal.config.icon}
        iconColor={errorModal.config.iconColor}
        title={errorModal.config.title}
        message={errorModal.config.message}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  currentTierCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentTierInfo: {
    marginLeft: 12,
    flex: 1,
  },
  currentTierLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  currentTierName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  limitsContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  limitValue: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  activationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 1,
  },
  activateButton: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    paddingTop: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  upgradeButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },
  warningContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  warningBold: {
    fontWeight: 'bold',
    color: colors.error,
  },
  warningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  warningFooterText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  demoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  demoCode: {
    fontSize: 13,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
