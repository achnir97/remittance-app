// Requires: npx expo install expo-document-picker
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { i18n } from '../../locales/i18n';

interface Props {
  onImageSelected: (uri: string) => void;
}

export function DocumentUploader({ onImageSelected }: Props) {
  const handleCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission', i18n.t('scan.permissionCamera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission', i18n.t('scan.permissionGallery'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handleCamera} activeOpacity={0.75}>
        <Ionicons name="camera-outline" size={20} color="#9B72FF" />
        <Text style={styles.btnText}>{i18n.t('legal.document.takePhoto')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={handleGallery} activeOpacity={0.75}>
        <Ionicons name="images-outline" size={20} color="#9B72FF" />
        <Text style={styles.btnText}>{i18n.t('legal.document.chooseGallery')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(155, 114, 255, 0.12)',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(155, 114, 255, 0.4)',
  },
  btnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#9B72FF',
  },
});
