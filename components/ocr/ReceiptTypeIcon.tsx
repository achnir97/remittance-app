import React from 'react';
import { Text } from 'react-native';
import { TransactionType } from '../../services/db';

interface Props {
  type: TransactionType;
}

export function ReceiptTypeIcon({ type }: Props) {
  let icon = '📦';
  switch (type) {
    case 'remittance':
      icon = '💸';
      break;
    case 'atm':
      icon = '🏧';
      break;
    case 'store':
      icon = '🛍️';
      break;
    case 'restaurant':
      icon = '🍱';
      break;
    case 'utility':
      icon = '🏠';
      break;
    case 'transport':
      icon = '🚇';
      break;
    case 'medical':
      icon = '💊';
      break;
    default:
      icon = '📦';
  }
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

