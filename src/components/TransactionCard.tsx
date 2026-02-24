import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface TransactionCardProps {
  name: string;
  date: string;
  weight: number;
  bags: number;
  phone: string;
  onPress: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  name,
  date,
  weight,
  bags,
  phone,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.date}>📅 {date}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{weight} kg</Text>
          <Text style={styles.statLabel}>Tổng kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{bags} bao</Text>
          <Text style={styles.statLabel}>Tổng bao</Text>
        </View>
      </View>
      <Text style={styles.phone}>📞 {phone}</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Xem chi tiết →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  date: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  phone: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
