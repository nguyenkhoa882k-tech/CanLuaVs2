import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
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
  PREMIUM_PRICES,
  PremiumTier,
} from '../services/premiumService';
import { validateActivationCode } from '../config/activationCodes';

interface PremiumScreenProps {
  navigation: any;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ navigation }) => {
  const [currentTier, setCurrentTier] = useState<PremiumTier>(getPremiumTier());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PremiumTier>('free');
  const [activationCode, setActivationCode] = useState('');

  const successModal = useModal();
  const errorModal = useModal();

  // QR Code payment info - Thông tin tài khoản ACB
  const PAYMENT_INFO = {
    bankName: 'ACB (Á Châu)',
    bankBin: '970416', // ACB bank code
    accountNumber: '26970047',
    accountName: 'NGUYEN DANG KHOA',
    supportEmail: 'khoa882k@gmail.com',
  };

  const getQRCodeUrl = (tier: PremiumTier) => {
    const amount =
      tier === 'tier1' ? PREMIUM_PRICES.tier1 : PREMIUM_PRICES.tier2;
    const content = getTransferContent(tier);

    // VietQR API format with amount and content
    // https://img.vietqr.io/image/{BIN}-{ACCOUNT_NUMBER}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={CONTENT}
    return `https://img.vietqr.io/image/${PAYMENT_INFO.bankBin}-${
      PAYMENT_INFO.accountNumber
    }-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
  };

  const getTransferContent = (tier: PremiumTier) => {
    const tierName = tier === 'tier1' ? 'GOI1' : 'GOI2';
    return `CANLUA ${tierName}`;
  };

  const handleUpgrade = (tier: PremiumTier) => {
    if (tier === 'free') return;
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);

    // Hiển thị thông báo chờ xác nhận
    successModal.showModal({
      title: 'Đang chờ xác nhận',
      message:
        'Cảm ơn bạn đã thanh toán!\n\n' +
        '📸 QUAN TRỌNG: Vui lòng chụp ảnh biên lai thanh toán\n' +
        '(Từ app ngân hàng, hiển thị rõ: số tiền, nội dung, thời gian)\n\n' +
        `📧 Gửi ảnh biên lai kèm thông tin về:\n${PAYMENT_INFO.supportEmail}\n\n` +
        '⏱️ Sau khi xác nhận thanh toán thành công, chúng tôi sẽ gửi mã kích hoạt qua email trong vòng 24h.\n\n' +
        '🔑 Khi nhận được mã:\nSettings → Gói Premium → Nhập mã kích hoạt',
      icon: 'clock-outline',
      iconColor: colors.warning,
      buttons: [
        {
          text: 'Gửi Email',
          onPress: () => {
            successModal.hideModal();
            handleSendEmail();
          },
          style: 'primary',
        },
        {
          text: 'Đã hiểu',
          onPress: () => {
            successModal.hideModal();
            navigation.goBack();
          },
          style: 'cancel',
        },
      ],
    });
  };

  const handleSendEmail = () => {
    const tier = selectedTier === 'tier1' ? 'Gói Nâng Cấp 1' : 'Gói Nâng Cấp 2';
    const price =
      selectedTier === 'tier1' ? PREMIUM_PRICES.tier1 : PREMIUM_PRICES.tier2;

    const subject = encodeURIComponent(`[Cân Lúa] Xác nhận thanh toán ${tier}`);
    const body = encodeURIComponent(
      `Kính gửi Admin,\n\n` +
        `Tôi đã chuyển khoản để nâng cấp tài khoản Cân Lúa App.\n\n` +
        `THÔNG TIN THANH TOÁN:\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• Gói: ${tier}\n` +
        `• Số tiền: ${price.toLocaleString('vi-VN')}đ\n` +
        `• Ngân hàng: ${PAYMENT_INFO.bankName}\n` +
        `• Số tài khoản: ${PAYMENT_INFO.accountNumber}\n` +
        `• Chủ tài khoản: ${PAYMENT_INFO.accountName}\n` +
        `• Nội dung CK: ${getTransferContent(selectedTier)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📸 HÌNH ẢNH BIÊN LAI:\n` +
        `Vui lòng đính kèm ảnh chụp màn hình biên lai thanh toán từ app ngân hàng.\n` +
        `(Ảnh cần rõ nét, hiển thị đầy đủ: số tiền, nội dung CK, thời gian)\n\n` +
        `📧 THÔNG TIN LIÊN HỆ:\n` +
        `• Email: [Email của bạn]\n` +
        `• Số điện thoại: [SĐT của bạn]\n\n` +
        `Vui lòng kiểm tra và gửi mã kích hoạt cho tôi qua email này.\n\n` +
        `Xin cảm ơn!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Gửi từ Cân Lúa App`,
    );

    Linking.openURL(
      `mailto:${PAYMENT_INFO.supportEmail}?subject=${subject}&body=${body}`,
    );
  };

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
      setShowActivationModal(false);
      setActivationCode('');

      successModal.showModal({
        title: 'Thành công! 🎉',
        message: `Tài khoản của bạn đã được nâng cấp lên ${
          result.tier === 'tier1' ? 'Gói Nâng Cấp 1' : 'Gói Nâng Cấp 2'
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

  const renderFeature = (icon: string, text: string, included: boolean) => (
    <View style={styles.featureRow}>
      <Icon
        name={included ? 'check-circle' : 'close-circle'}
        size={20}
        color={included ? colors.success : colors.text.light}
      />
      <Text
        style={[styles.featureText, !included && styles.featureTextDisabled]}
      >
        {text}
      </Text>
    </View>
  );

  const renderPricingCard = (
    tier: PremiumTier,
    title: string,
    price: string,
    features: { icon: string; text: string; included: boolean }[],
    recommended?: boolean,
  ) => {
    const isCurrentTier = currentTier === tier;
    const isUpgrade = tier !== 'free' && currentTier === 'free';

    return (
      <View
        style={[
          styles.pricingCard,
          recommended && styles.pricingCardRecommended,
          isCurrentTier && styles.pricingCardCurrent,
        ]}
      >
        {recommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>PHỔ BIẾN</Text>
          </View>
        )}

        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Icon name="check-circle" size={16} color={colors.white} />
            <Text style={styles.currentText}>GÓI HIỆN TẠI</Text>
          </View>
        )}

        <View style={styles.pricingHeader}>
          <Text style={styles.pricingTitle}>{title}</Text>
          <Text style={styles.pricingPrice}>{price}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index}>
              {renderFeature(feature.icon, feature.text, feature.included)}
            </View>
          ))}
        </View>

        {!isCurrentTier && tier !== 'free' && (
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              recommended && styles.upgradeButtonRecommended,
            ]}
            onPress={() => handleUpgrade(tier)}
          >
            <Text
              style={[
                styles.upgradeButtonText,
                recommended && styles.upgradeButtonTextRecommended,
              ]}
            >
              {isUpgrade ? 'Nâng cấp ngay' : 'Chọn gói này'}
            </Text>
          </TouchableOpacity>
        )}

        {isCurrentTier && tier === 'free' && (
          <View style={styles.currentPlanButton}>
            <Text style={styles.currentPlanText}>Gói miễn phí</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp tài khoản</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Icon name="crown" size={48} color={colors.warning} />
          <Text style={styles.introTitle}>Mở khóa toàn bộ tính năng</Text>
          <Text style={styles.introSubtitle}>
            Nâng cấp để quản lý nhiều người mua và người bán hơn
          </Text>
        </View>

        {/* Free Tier */}
        {renderPricingCard('free', 'Miễn phí', '0đ', [
          { icon: 'account', text: 'Tối đa 1 người mua', included: true },
          {
            icon: 'account-group',
            text: 'Mỗi người mua: 7 người bán',
            included: true,
          },
          { icon: 'chart-line', text: 'Báo cáo cơ bản', included: true },
          { icon: 'cloud-upload', text: 'Sao lưu dữ liệu', included: true },
          { icon: 'crown', text: 'Không giới hạn', included: false },
        ])}

        {/* Tier 1 */}
        {renderPricingCard(
          'tier1',
          'Gói Nâng Cấp 1',
          '50,000đ',
          [
            { icon: 'account', text: 'Tối đa 15 người mua', included: true },
            {
              icon: 'account-group',
              text: 'Mỗi người mua: 5 người bán',
              included: true,
            },
            { icon: 'chart-line', text: 'Báo cáo chi tiết', included: true },
            { icon: 'cloud-upload', text: 'Sao lưu dữ liệu', included: true },
            { icon: 'headset', text: 'Hỗ trợ ưu tiên', included: true },
          ],
          true, // recommended
        )}

        {/* Tier 2 */}
        {renderPricingCard('tier2', 'Gói Nâng Cấp 2', '100,000đ', [
          {
            icon: 'infinity',
            text: 'Không giới hạn người mua',
            included: true,
          },
          {
            icon: 'infinity',
            text: 'Không giới hạn người bán',
            included: true,
          },
          { icon: 'chart-line', text: 'Báo cáo nâng cao', included: true },
          { icon: 'cloud-upload', text: 'Sao lưu tự động', included: true },
          { icon: 'headset', text: 'Hỗ trợ VIP 24/7', included: true },
          { icon: 'star', text: 'Tính năng độc quyền', included: true },
        ])}

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

        <View style={styles.contactSection}>
          <Icon name="information" size={24} color={colors.primary} />
          <Text style={styles.contactTitle}>Cần hỗ trợ?</Text>
          <Text style={styles.contactText}>
            Liên hệ với chúng tôi để được tư vấn và hỗ trợ thanh toán
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:khoa882k@gmail.com')}
          >
            <Icon name="email" size={20} color={colors.white} />
            <Text style={styles.contactButtonText}>khoa882k@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>🎁 Mã demo để test:</Text>
          <Text style={styles.demoCode}>Gói 1: CL1-A7K9-M2P4-X8Q1</Text>
          <Text style={styles.demoCode}>Gói 2: CL2-M6G1-E8J4-K2X7</Text>
          <Text style={styles.demoNote}>
            (Mã thật sẽ được gửi qua email sau khi xác nhận thanh toán)
          </Text>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.paymentModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>
                  {selectedTier === 'tier1'
                    ? 'Gói Nâng Cấp 1'
                    : 'Gói Nâng Cấp 2'}
                </Text>
                <Text style={styles.paymentPrice}>
                  {(selectedTier === 'tier1'
                    ? PREMIUM_PRICES.tier1
                    : PREMIUM_PRICES.tier2
                  ).toLocaleString('vi-VN')}
                  đ
                </Text>
              </View>

              <View style={styles.qrSection}>
                <Text style={styles.sectionTitle}>
                  Quét mã QR để thanh toán
                </Text>
                <View style={styles.qrCodeContainer}>
                  <Image
                    source={{ uri: getQRCodeUrl(selectedTier) }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.bankInfoSection}>
                <Text style={styles.sectionTitle}>
                  Hoặc chuyển khoản thủ công
                </Text>
                <View style={styles.bankInfoRow}>
                  <Icon name="bank" size={20} color={colors.primary} />
                  <View style={styles.bankInfoText}>
                    <Text style={styles.bankInfoLabel}>Ngân hàng</Text>
                    <Text style={styles.bankInfoValue}>
                      {PAYMENT_INFO.bankName}
                    </Text>
                  </View>
                </View>
                <View style={styles.bankInfoRow}>
                  <Icon name="credit-card" size={20} color={colors.primary} />
                  <View style={styles.bankInfoText}>
                    <Text style={styles.bankInfoLabel}>Số tài khoản</Text>
                    <Text style={styles.bankInfoValue}>
                      {PAYMENT_INFO.accountNumber}
                    </Text>
                  </View>
                </View>
                <View style={styles.bankInfoRow}>
                  <Icon name="account" size={20} color={colors.primary} />
                  <View style={styles.bankInfoText}>
                    <Text style={styles.bankInfoLabel}>Chủ tài khoản</Text>
                    <Text style={styles.bankInfoValue}>
                      {PAYMENT_INFO.accountName}
                    </Text>
                  </View>
                </View>
                <View style={styles.bankInfoRow}>
                  <Icon name="message-text" size={20} color={colors.primary} />
                  <View style={styles.bankInfoText}>
                    <Text style={styles.bankInfoLabel}>
                      Nội dung chuyển khoản
                    </Text>
                    <Text style={styles.bankInfoValue}>
                      {getTransferContent(selectedTier)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.noteSection}>
                <Icon name="information" size={20} color={colors.warning} />
                <Text style={styles.noteText}>
                  Sau khi chuyển khoản thành công, vui lòng nhập mã kích hoạt để
                  mở khóa gói premium.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handlePaymentComplete}
            >
              <Text style={styles.paymentButtonText}>Đã chuyển khoản</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Activation Modal */}
      <Modal
        visible={showActivationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.activationModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập mã kích hoạt</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowActivationModal(false);
                  setActivationCode('');
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.activationContent}>
              <Icon name="key" size={48} color={colors.primary} />
              <Text style={styles.activationText}>
                Vui lòng nhập mã kích hoạt bạn đã nhận được sau khi thanh toán
              </Text>

              <TextInput
                style={styles.activationInput}
                placeholder="Nhập mã kích hoạt"
                placeholderTextColor={colors.text.light}
                value={activationCode}
                onChangeText={setActivationCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.activationButton}
                onPress={handleActivationSubmit}
              >
                <Text style={styles.activationButtonText}>Kích hoạt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowActivationModal(false);
                  setActivationCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pricingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pricingCardRecommended: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  pricingCardCurrent: {
    borderColor: colors.success,
    borderWidth: 3,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  pricingHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  featureTextDisabled: {
    color: colors.text.light,
    textDecorationLine: 'line-through',
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonRecommended: {
    backgroundColor: colors.primary,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButtonTextRecommended: {
    color: colors.white,
  },
  currentPlanButton: {
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentPlanText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  contactSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
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
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  demoSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
  demoNote: {
    fontSize: 12,
    color: colors.text.light,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  activationModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  paymentModalContent: {
    maxHeight: 500,
  },
  paymentInfo: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  paymentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  qrSection: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  bankInfoSection: {
    padding: 20,
    backgroundColor: colors.background,
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  bankInfoText: {
    flex: 1,
  },
  bankInfoLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  bankInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  noteSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF9E6',
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  paymentButton: {
    backgroundColor: colors.primary,
    padding: 16,
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
  },
  paymentButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activationContent: {
    padding: 24,
    alignItems: 'center',
  },
  activationText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  activationInput: {
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
  },
  activationButton: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  activationButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
