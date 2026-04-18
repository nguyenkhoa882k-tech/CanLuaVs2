import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface BackupFile {
  name: string;
  path: string;
  size: number;
  date: Date;
}

interface DataManagementModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  onExport: (action: 'save' | 'share') => Promise<void>;
  onImport: (filepath: string) => Promise<void>;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  visible,
  onClose,
  mode,
  onExport,
  onImport,
}) => {
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    if (visible && mode === 'import') {
      loadBackupFiles();
    }
  }, [visible, mode]);

  const loadBackupFiles = async () => {
    try {
      setLoading(true);
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const downloadDir = dirs.DownloadDir;

      // Check if directory exists
      const exists = await ReactNativeBlobUtil.fs.exists(downloadDir);
      if (!exists) {
        setBackupFiles([]);
        return;
      }

      // List all files in Download directory
      const files = await ReactNativeBlobUtil.fs.ls(downloadDir);

      // Filter backup files
      const backupFilesList: BackupFile[] = [];
      for (const filename of files) {
        if (
          filename.startsWith('CanLua_Backup_') &&
          filename.endsWith('.json')
        ) {
          const filepath = `${downloadDir}/${filename}`;
          const stat = await ReactNativeBlobUtil.fs.stat(filepath);

          backupFilesList.push({
            name: filename,
            path: filepath,
            size: parseInt(stat.size),
            date: new Date(stat.lastModified),
          });
        }
      }

      // Sort by date (newest first)
      backupFilesList.sort((a, b) => b.date.getTime() - a.date.getTime());

      setBackupFiles(backupFilesList);
    } catch (error) {
      console.error('Error loading backup files:', error);
      setBackupFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImportFile = async (filepath: string) => {
    try {
      setLoading(true);
      await onImport(filepath);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAction = async (action: 'save' | 'share') => {
    try {
      setLoading(true);
      await onExport(action);
      if (action === 'save') {
        // Reload file list after saving
        await loadBackupFiles();
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon
                name={mode === 'export' ? 'export' : 'import'}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.title}>
                {mode === 'export' ? 'Xuất dữ liệu' : 'Nhập dữ liệu'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {mode === 'export' ? (
              // Export options
              <View>
                <Text style={styles.description}>
                  Chọn cách xuất dữ liệu sao lưu:
                </Text>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleExportAction('save')}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: '#4CAF5015' },
                    ]}
                  >
                    <Icon name="content-save" size={32} color="#4CAF50" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Lưu vào máy</Text>
                    <Text style={styles.actionSubtitle}>
                      Lưu file vào thư mục Downloads
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={24}
                    color={colors.text.light}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => handleExportAction('share')}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: '#2196F315' },
                    ]}
                  >
                    <Icon name="share-variant" size={32} color="#2196F3" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Chia sẻ</Text>
                    <Text style={styles.actionSubtitle}>
                      Gửi qua email, Zalo, hoặc ứng dụng khác
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={24}
                    color={colors.text.light}
                  />
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Icon name="information" size={20} color={colors.primary} />
                  <Text style={styles.infoText}>
                    File sao lưu sẽ được lưu dưới định dạng JSON và có thể nhập
                    lại bất cứ lúc nào.
                  </Text>
                </View>
              </View>
            ) : (
              // Import - show file list
              <View>
                <Text style={styles.description}>
                  Chọn file sao lưu để nhập dữ liệu:
                </Text>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>
                      Đang tải danh sách file...
                    </Text>
                  </View>
                ) : backupFiles.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="file-alert"
                      size={64}
                      color={colors.text.light}
                    />
                    <Text style={styles.emptyText}>
                      Không tìm thấy file sao lưu
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Vui lòng xuất dữ liệu trước khi nhập
                    </Text>
                  </View>
                ) : (
                  backupFiles.map((file, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.fileCard,
                        selectedFile === file.path && styles.fileCardSelected,
                      ]}
                      onPress={() => setSelectedFile(file.path)}
                    >
                      <View style={styles.fileIcon}>
                        <Icon
                          name="file-document"
                          size={32}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.fileContent}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileInfo}>
                          {formatFileSize(file.size)} • {formatDate(file.date)}
                        </Text>
                      </View>
                      {selectedFile === file.path && (
                        <Icon
                          name="check-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                )}

                {backupFiles.length > 0 && (
                  <View style={styles.infoBox}>
                    <Icon name="information" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                      Nhập dữ liệu sẽ thay thế toàn bộ dữ liệu hiện tại. Hãy
                      xuất dữ liệu hiện tại trước khi nhập.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {mode === 'import' && backupFiles.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  !selectedFile && styles.importButtonDisabled,
                ]}
                onPress={() => selectedFile && handleImportFile(selectedFile)}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Icon name="import" size={20} color={colors.white} />
                    <Text style={styles.importButtonText}>Nhập dữ liệu</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {loading && mode === 'export' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang xử lý...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.light,
    marginTop: 8,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fileCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  importButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: colors.border,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
