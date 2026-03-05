import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

function SkeletonBox({
  width,
  height,
  borderRadius = theme.radius.sm,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#CBD5E1', opacity },
        style,
      ]}
    />
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={32} height={32} borderRadius={16} />
        <View style={styles.cardHeaderText}>
          <SkeletonBox width={120} height={16} />
          <SkeletonBox width={80} height={12} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.heroRow}>
        <SkeletonBox width={180} height={40} borderRadius={8} />
      </View>
      <View style={styles.detailRow}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={80} height={12} />
      </View>
      <View style={[styles.detailRow, { marginTop: 6 }]}>
        <SkeletonBox width={120} height={12} />
        <SkeletonBox width={90} height={12} />
      </View>
    </View>
  );
}

export const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  heroRow: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
