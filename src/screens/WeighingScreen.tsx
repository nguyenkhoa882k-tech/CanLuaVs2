import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import * as db from '../services/database';
import { useStore } from '../store/useStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = ['a', 'b', 'c', 'd', 'e'] as const;
const ROWS_PER_TABLE = 5;

export const WeighingScreen = ({ route, navigation }: any) => {
  const { seller } = route.params;
  const inputDigits = useStore(state => state.inputDigits);

  const [transactionId, setTransactionId] = useState('');
  const [subtractWeight, setSubtractWeight] = useState('0');
  const [pricePerKg, setPricePerKg] = useState(seller.price.toString());
  const [deposit, setDeposit] = useState('0');
  const [paid, setPaid] = useState('0');

  // Display values with formatting
  const [displayPricePerKg, setDisplayPricePerKg] = useState('');
  const [displayDeposit, setDisplayDeposit] = useState('');
  const [displayPaid, setDisplayPaid] = useState('');

  const [locked, setLocked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [tables, setTables] = useState([
    {
      id: 1,
      rows: Array(ROWS_PER_TABLE)
        .fill(null)
        .map(() => ({ a: '', b: '', c: '', d: '', e: '' })),
    },
  ]);

  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [viewingTableIndex, setViewingTableIndex] = useState(0);

  const inputRefs = useRef<any>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load transaction data
  useEffect(() => {
    loadTransaction();

    // Save data when component unmounts
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Note: Can't use async in cleanup, but saveData will be called by handleGoBack
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTransaction = async () => {
    try {
      const transactions = await db.getTransactionsBySellerId(seller.id);

      if (transactions.length > 0) {
        const transaction = transactions[0];

        setTransactionId(transaction.id);
        setSubtractWeight(transaction.subtractWeight.toString());

        // Set price with formatting
        const priceValue = transaction.pricePerKg.toString();
        setPricePerKg(priceValue);
        setDisplayPricePerKg(parseInt(priceValue, 10).toLocaleString('vi-VN'));

        // Set deposit with formatting
        const depositValue = transaction.deposit.toString();
        setDeposit(depositValue);
        setDisplayDeposit(parseInt(depositValue, 10).toLocaleString('vi-VN'));

        // Set paid with formatting
        const paidValue = transaction.paid.toString();
        setPaid(paidValue);
        setDisplayPaid(parseInt(paidValue, 10).toLocaleString('vi-VN'));

        if (transaction.bagData) {
          const loadedTables = JSON.parse(transaction.bagData);
          setTables(loadedTables);

          // Find the last table with data and set as current
          let lastTableWithData = 0;
          for (let ti = loadedTables.length - 1; ti >= 0; ti--) {
            const hasData = loadedTables[ti].rows.some((row: any) =>
              COLS.some(col => row[col] && row[col].trim() !== ''),
            );
            if (hasData) {
              lastTableWithData = ti;
              break;
            }
          }

          setCurrentTableIndex(lastTableWithData);
          setViewingTableIndex(lastTableWithData);

          // Scroll to the table after a short delay
          setTimeout(() => scrollToTable(lastTableWithData), 100);
        }
      } else {
        // Initialize display values for new transaction
        setDisplayPricePerKg(
          parseInt(seller.price.toString(), 10).toLocaleString('vi-VN'),
        );
        setDisplayDeposit('0');
        setDisplayPaid('0');
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    }
  };

  // Auto-save with debounce
  const saveData = useCallback(async () => {
    try {
      // Calculate total bags and weight
      let totalBags = 0;
      let totalWeight = 0;

      tables.forEach(table => {
        table.rows.forEach(row => {
          COLS.forEach(col => {
            const inputValue = row[col] || '0';
            const numValue = parseFloat(inputValue);

            if (numValue > 0) {
              totalBags++;
              const actualValue = numValue / 10;
              totalWeight += actualValue;
            }
          });
        });
      });

      const transaction = {
        id: transactionId || Date.now().toString(),
        sellerId: seller.id,
        subtractWeight: parseFloat(subtractWeight || '0'),
        actualWeight: 0, // Will be calculated
        pricePerKg: parseFloat(pricePerKg || '0'),
        deposit: parseFloat(deposit || '0'),
        paid: parseFloat(paid || '0'),
        bagData: JSON.stringify(tables),
        totalBags,
        totalWeight,
        date: new Date().toLocaleDateString('vi-VN'),
      };

      if (transactionId) {
        await db.updateTransaction(transaction);
      } else {
        await db.addTransaction(transaction);
        setTransactionId(transaction.id);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }, [
    transactionId,
    seller.id,
    subtractWeight,
    pricePerKg,
    deposit,
    paid,
    tables,
  ]);

  // Debounced auto-save (1.5 seconds)
  useEffect(() => {
    // Don't save if no transaction data yet (empty table with no input)
    const hasData = tables.some(table =>
      table.rows.some(row =>
        COLS.some(col => row[col] && row[col].trim() !== ''),
      ),
    );

    if (!transactionId && !hasData) {
      console.log('Skipping save: no transaction ID and no data');
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    console.log('Scheduling save in 1.5 seconds...');
    saveTimerRef.current = setTimeout(() => {
      saveData();
    }, 1500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveData, transactionId, tables]);

  // Format money input handlers
  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) {
      setPricePerKg('0');
      setDisplayPricePerKg('');
      return;
    }
    setPricePerKg(numericValue);
    setDisplayPricePerKg(parseInt(numericValue, 10).toLocaleString('vi-VN'));
  };

  const handleDepositChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) {
      setDeposit('0');
      setDisplayDeposit('');
      return;
    }
    setDeposit(numericValue);
    setDisplayDeposit(parseInt(numericValue, 10).toLocaleString('vi-VN'));
  };

  const handlePaidChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) {
      setPaid('0');
      setDisplayPaid('');
      return;
    }
    setPaid(numericValue);
    setDisplayPaid(parseInt(numericValue, 10).toLocaleString('vi-VN'));
  };

  // Calculate bag weights (just divide by 10 to get decimal)
  const calculateBagWeights = useMemo(() => {
    return tables.map(table =>
      table.rows.map(row =>
        COLS.map(col => {
          const inputValue = row[col] || '0';
          // Convert input to actual weight: divide by 10 to get decimal
          // e.g., "356" becomes 35.6, "3567" becomes 356.7
          const actualValue = parseFloat(inputValue) / 10;
          return actualValue;
        }),
      ),
    );
  }, [tables]);

  // Calculate column totals for each table
  const columnTotals = useMemo(() => {
    return tables.map((table, ti) => {
      const totals = [0, 0, 0, 0, 0];
      calculateBagWeights[ti].forEach(row => {
        row.forEach((weight, colIndex) => {
          totals[colIndex] += weight;
        });
      });
      // Don't round here - keep full precision for accurate calculations
      return totals;
    });
  }, [calculateBagWeights, tables]);

  // Total weight across all tables
  const totalWeight = useMemo(() => {
    return columnTotals.reduce(
      (sum, tableTotals) => sum + tableTotals.reduce((s, t) => s + t, 0),
      0,
    );
  }, [columnTotals]);

  // Net weight after subtracting impurity
  const actualWeight = useMemo(() => {
    return Math.max(totalWeight - parseFloat(subtractWeight || '0'), 0);
  }, [totalWeight, subtractWeight]);

  // Total amount
  const totalAmount = useMemo(() => {
    return actualWeight * parseFloat(pricePerKg || '0');
  }, [actualWeight, pricePerKg]);

  // Remaining amount
  const remaining = useMemo(() => {
    return totalAmount - parseFloat(deposit || '0') - parseFloat(paid || '0');
  }, [totalAmount, deposit, paid]);

  // Find first empty cell in current table
  const findCurrentCell = useCallback(() => {
    const table = tables[currentTableIndex];
    if (!table) return null;

    for (let colKey of COLS) {
      for (let ri = 0; ri < ROWS_PER_TABLE; ri++) {
        if (!table.rows[ri][colKey]) {
          return { ti: currentTableIndex, ri, col: colKey };
        }
      }
    }

    // If current table is full, check if there's a next table
    if (currentTableIndex < tables.length - 1) {
      const nextTable = tables[currentTableIndex + 1];
      for (let colKey of COLS) {
        for (let ri = 0; ri < ROWS_PER_TABLE; ri++) {
          if (!nextTable.rows[ri][colKey]) {
            return { ti: currentTableIndex + 1, ri, col: colKey };
          }
        }
      }
    }

    return null;
  }, [tables, currentTableIndex]);

  // Handle cell input change
  const onChangeCell = (
    ti: number,
    ri: number,
    col: (typeof COLS)[number],
    value: string,
  ) => {
    setTables(prev =>
      prev.map((t, idx) =>
        idx === ti
          ? {
              ...t,
              rows: t.rows.map((r, rIdx) =>
                rIdx === ri ? { ...r, [col]: value } : r,
              ),
            }
          : t,
      ),
    );

    // Auto-focus next cell when reaching max digits
    if (value.length === inputDigits) {
      const colIndex = COLS.indexOf(col);

      // Move down in same column
      if (ri < ROWS_PER_TABLE - 1) {
        const nextRef = inputRefs.current[`${ti}-${ri + 1}-${col}`];
        if (nextRef) nextRef.focus();
      }
      // Move to next column, first row
      else if (colIndex < COLS.length - 1) {
        const nextCol = COLS[colIndex + 1];
        const nextRef = inputRefs.current[`${ti}-0-${nextCol}`];
        if (nextRef) nextRef.focus();
      }
      // Last cell - create new table
      else if (ri === ROWS_PER_TABLE - 1 && col === 'e') {
        if (tables.length < 10) {
          setTables(prev => [
            ...prev,
            {
              id: prev.length + 1,
              rows: Array(ROWS_PER_TABLE)
                .fill(null)
                .map(() => ({ a: '', b: '', c: '', d: '', e: '' })),
            },
          ]);
        }
        setCurrentTableIndex(ti + 1);
        setViewingTableIndex(ti + 1);
        setTimeout(() => scrollToTable(ti + 1), 50);
        setTimeout(() => {
          const nextRef = inputRefs.current[`${ti + 1}-0-a`];
          if (nextRef) nextRef.focus();
        }, 300);
      }
    }
  };

  // Scroll to specific table
  const scrollToTable = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (SCREEN_WIDTH - 40),
        animated: true,
      });
    }
  };

  // Navigation between tables
  const goToPrevTable = () => {
    if (viewingTableIndex > 0) {
      const newIndex = viewingTableIndex - 1;
      setViewingTableIndex(newIndex);
      scrollToTable(newIndex);
    }
  };

  const goToNextTable = () => {
    if (viewingTableIndex < tables.length - 1) {
      const newIndex = viewingTableIndex + 1;
      setViewingTableIndex(newIndex);
      scrollToTable(newIndex);
    }
  };

  // Toggle lock
  const toggleLock = () => {
    const newLocked = !locked;
    setLocked(newLocked);

    if (newLocked) {
      // Find the current table with empty cells
      const current = findCurrentCell();
      if (current) {
        // Update viewing and current table index
        setCurrentTableIndex(current.ti);
        setViewingTableIndex(current.ti);

        // Scroll to the correct table
        setTimeout(() => scrollToTable(current.ti), 50);

        // Focus on the empty cell
        setTimeout(() => {
          const ref =
            inputRefs.current[`${current.ti}-${current.ri}-${current.col}`];
          if (ref) ref.focus();
        }, 500);
      }
    }
  };

  // Confirm and save
  const handleConfirm = async () => {
    if (confirmed) {
      // Show option to reopen
      Alert.alert(
        'Đã kết sổ',
        'Giao dịch này đã được xác nhận và kết sổ.\n\nBạn có muốn mở lại sổ để chỉnh sửa?',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Mở sổ',
            style: 'destructive',
            onPress: async () => {
              setConfirmed(false);
              setLocked(false);
              await saveData();
              Alert.alert(
                'Đã mở sổ',
                'Bạn có thể chỉnh sửa lại giao dịch này.',
              );
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      'Xác nhận kết sổ',
      `Tổng tiền: ${totalAmount.toLocaleString()} đ\nCòn lại: ${remaining.toLocaleString()} đ\n\nBạn có chắc muốn kết sổ?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setConfirmed(true);
            setLocked(false); // Unlock when confirmed
            await saveData();
            Alert.alert('Thành công', 'Đã kết sổ!');
          },
        },
      ],
    );
  };

  // Handle back button - save before going back
  const handleGoBack = async () => {
    // Clear debounce timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Save immediately before going back
    await saveData();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.lockButton, locked && styles.lockButtonActive]}
            onPress={toggleLock}
            disabled={confirmed}
          >
            <Text style={styles.lockIcon}>{locked ? '🔓' : '🔒'}</Text>
            <Text style={styles.lockText}>{locked ? 'Mở' : 'Khóa'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerIcon}>👤</Text>
          <Text style={styles.sellerName}>{seller.name}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Tổng kết</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>
                {totalWeight.toLocaleString('vi-VN', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </Text>
              <Text style={styles.summaryLabel}>Tổng kg</Text>
            </View>
            <View style={[styles.summaryBox, styles.summaryBoxBlue]}>
              <Text style={[styles.summaryValue, styles.summaryValueBlue]}>
                {tables.reduce(
                  (sum, t) =>
                    sum +
                    t.rows.reduce(
                      (s, r) =>
                        s +
                        COLS.filter(c => r[c] && parseFloat(r[c]) > 0).length,
                      0,
                    ),
                  0,
                )}
              </Text>
              <Text style={[styles.summaryLabel, styles.summaryLabelBlue]}>
                Số bao
              </Text>
            </View>
          </View>

          {/* Subtract Weight */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Trừ tạp chất (kg)</Text>
              <Text style={styles.redValue}>
                -
                {parseFloat(subtractWeight || '0').toLocaleString('vi-VN', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                kg
              </Text>
            </View>
            <TextInput
              style={styles.input}
              value={subtractWeight}
              onChangeText={setSubtractWeight}
              keyboardType="numeric"
              editable={!locked && !confirmed}
            />
          </View>

          {/* Actual Weight */}
          <View style={styles.actualWeightCard}>
            <Text style={styles.actualWeightIcon}>✅</Text>
            <Text style={styles.actualWeightText}>
              Thực:{' '}
              {actualWeight.toLocaleString('vi-VN', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              kg
            </Text>
          </View>

          {/* Price per kg */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Đơn giá (đ/kg)</Text>
            <TextInput
              style={styles.input}
              value={displayPricePerKg}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              editable={!locked && !confirmed}
              placeholder="0"
              placeholderTextColor={colors.text.light}
            />
          </View>

          {/* Total Amount */}
          <View style={styles.totalAmountCard}>
            <Text style={styles.totalAmountIcon}>💰</Text>
            <Text style={styles.totalAmountText}>
              {totalAmount.toLocaleString('vi-VN')} đ
            </Text>
          </View>

          {/* Deposit */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiền cọc (đ)</Text>
            <TextInput
              style={styles.input}
              value={displayDeposit}
              onChangeText={handleDepositChange}
              keyboardType="numeric"
              editable={!locked && !confirmed}
              placeholder="0"
              placeholderTextColor={colors.text.light}
            />
          </View>

          {/* Paid */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiền đã trả (đ)</Text>
            <TextInput
              style={styles.input}
              value={displayPaid}
              onChangeText={handlePaidChange}
              keyboardType="numeric"
              editable={!locked && !confirmed}
              placeholder="0"
              placeholderTextColor={colors.text.light}
            />
          </View>

          {/* Remaining */}
          <View style={styles.remainingCard}>
            <Text style={styles.remainingText}>
              {remaining.toLocaleString('vi-VN')} đ
            </Text>
            <Text style={styles.remainingLabel}>Còn lại</Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmIcon}>✅</Text>
            <Text style={styles.confirmText}>
              {confirmed ? 'Đã kết sổ' : 'Xác nhận và kết sổ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Navigation */}
        <View style={styles.bagNavigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              viewingTableIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={goToPrevTable}
            disabled={viewingTableIndex === 0}
          >
            <Text
              style={[
                styles.navButtonText,
                viewingTableIndex === 0 && styles.navButtonTextDisabled,
              ]}
            >
              ← Trước
            </Text>
          </TouchableOpacity>
          <View style={styles.bagIndicator}>
            <Text style={styles.bagIndicatorIcon}>🗑️</Text>
            <Text style={styles.bagIndicatorText}>
              Bảng {viewingTableIndex + 1}/{tables.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.navButton,
              viewingTableIndex === tables.length - 1 &&
                styles.navButtonDisabled,
            ]}
            onPress={goToNextTable}
            disabled={viewingTableIndex === tables.length - 1}
          >
            <Text
              style={[
                styles.navButtonText,
                viewingTableIndex === tables.length - 1 &&
                  styles.navButtonTextDisabled,
              ]}
            >
              Sau →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bags Grid - Single Table View */}
        <View style={styles.tableContainer}>
          {(() => {
            const ti = viewingTableIndex;
            const table = tables[ti];
            if (!table) return null;

            return (
              <View key={table.id} style={styles.table}>
                {/* Data Rows */}
                {table.rows.map((row, ri) => (
                  <View key={ri} style={styles.tableRow}>
                    {COLS.map(col => {
                      const canEdit =
                        !confirmed && locked && ti <= currentTableIndex;
                      return (
                        <TextInput
                          key={col}
                          ref={ref => {
                            inputRefs.current[`${ti}-${ri}-${col}`] = ref;
                          }}
                          style={[
                            styles.bagCell,
                            !canEdit && styles.bagCellDisabled,
                          ]}
                          value={row[col]}
                          onChangeText={v => onChangeCell(ti, ri, col, v)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.text.light}
                          editable={canEdit}
                          selectTextOnFocus
                          maxLength={inputDigits}
                        />
                      );
                    })}
                  </View>
                ))}

                {/* Total Row */}
                <View style={styles.tableRow}>
                  {columnTotals[ti].map((total, idx) => (
                    <View key={idx} style={styles.bagWeightCell}>
                      <Text style={styles.bagWeightText}>
                        {total.toLocaleString('vi-VN', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Table Summary */}
                <View style={styles.totalWeightCard}>
                  <Text style={styles.totalWeightIcon}>⚖️</Text>
                  <Text style={styles.totalWeightLabel}>
                    Tổng bảng:{' '}
                    <Text style={styles.totalWeightValue}>
                      {columnTotals[ti]
                        .reduce((s, t) => s + t, 0)
                        .toLocaleString('vi-VN', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                      kg
                    </Text>
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Final Summary */}
        <View style={styles.finalSummaryCard}>
          <Text style={styles.finalSummaryIcon}>⚖️</Text>
          <Text style={styles.finalSummaryWeight}>
            {totalWeight.toLocaleString('vi-VN', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            <Text style={styles.finalSummaryUnit}>kg</Text>
          </Text>
          <Text style={styles.finalSummaryLabel}>
            Tổng kết {tables.length} bảng
          </Text>
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
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.white,
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: colors.white,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lockButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  lockIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  lockText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sellerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
  },
  summaryBoxBlue: {
    backgroundColor: '#DBEAFE',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryValueBlue: {
    color: '#2563EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  summaryLabelBlue: {
    color: '#2563EB',
  },
  inputGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  redValue: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actualWeightCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actualWeightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actualWeightText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  totalAmountCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmountIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D97706',
  },
  remainingCard: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  remainingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
    flex: 1,
  },
  remainingLabel: {
    fontSize: 12,
    color: '#4F46E5',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  bagNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  navButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: colors.border,
  },
  navButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.text.light,
  },
  bagIndicator: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bagIndicatorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  bagIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  tableContainer: {
    paddingHorizontal: 20,
  },
  table: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  bagCell: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  bagCellDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  bagWeightCell: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bagWeightText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  totalWeightCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalWeightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  totalWeightLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  totalWeightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  finalSummaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  finalSummaryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  finalSummaryWeight: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  finalSummaryUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  finalSummaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
