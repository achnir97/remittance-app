import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const EMERGENCY_CONTACTS = [
  { number: '112', label: 'Police (경찰)' },
  { number: '1366', label: 'Emergency / Forced Labor Line' },
  { number: '119', label: 'Ambulance / Fire (소방)' },
];

interface Props {
  note?: string;
}

export function EmergencyBanner({ note }: Props) {
  const handleCall = (number: string, label: string) => {
    const url = `tel:${number}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) Linking.openURL(url);
      else Alert.alert('Call', `Dial ${number} — ${label}`);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="warning" size={20} color="#fff" />
        <Text style={styles.title}>🚨 EMERGENCY CONTACTS</Text>
      </View>
      <View style={styles.divider} />
      {EMERGENCY_CONTACTS.map(({ number, label }) => (
        <TouchableOpacity
          key={number}
          style={styles.callBtn}
          onPress={() => handleCall(number, label)}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={16} color="#fff" />
          <Text style={styles.callNumber}>{number}</Text>
          <Text style={styles.callLabel}>{label}</Text>
        </TouchableOpacity>
      ))}
      {note && (
        <View style={styles.noteBox}>
          <Text style={styles.note}>{note}</Text>
        </View>
      )}
      <Text style={styles.rights}>
        You have rights regardless of your visa status.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.red,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: theme.spacing.sm,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  callNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: '#fff',
  },
  callLabel: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  noteBox: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  note: {
    fontSize: theme.fontSize.sm,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 20,
  },
  rights: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});
