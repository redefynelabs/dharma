import { Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/theme';

const SPRING = { damping: 22, stiffness: 280, mass: 0.9 };
const LABEL_TIMING = { duration: 180, easing: Easing.out(Easing.quad) };

const TABS = [
  { name: 'index', icon: '⌂', label: 'Home', href: '/(app)/(tabs)/' },
  { name: 'scriptures', icon: '☷', label: 'Scriptures', href: '/(app)/(tabs)/scriptures' },
  { name: 'chat', icon: '✦', label: 'Wisdom', href: '/(app)/(tabs)/chat' },
  { name: 'profile', icon: '◎', label: 'Profile', href: '/(app)/(tabs)/profile' },
];

function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  // Sliding pill position & size
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const pillReady = useSharedValue(0);

  // Store each tab's measured layout
  const layouts = useRef<{ x: number; width: number }[]>([]);

  const activeIndex = (() => {
    const i = TABS.findIndex((t) => {
      if (t.name === 'index') return pathname === '/' || pathname === '/index' || pathname.endsWith('/(tabs)/') || pathname.endsWith('/(tabs)');
      return pathname.includes(t.name);
    });
    return i === -1 ? 0 : i;
  })();

  const movePill = useCallback((index: number) => {
    const layout = layouts.current[index];
    if (!layout) return;
    pillX.value = withSpring(layout.x, SPRING);
    pillW.value = withSpring(layout.width, SPRING);
  }, []);

  useEffect(() => {
    movePill(activeIndex);
  }, [activeIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillReady.value,
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 4 }]}>
      {/* Fade scrim — softens content scrolling under the bar */}
      <LinearGradient
        colors={['transparent', 'rgba(8,6,4,0.72)', 'rgba(8,6,4,0.97)']}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.bar}>
        {/* Single sliding pill */}
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />

        {TABS.map((tab, index) => {
          const focused = index === activeIndex;
          // Per-tab shared values for icon color + label reveal
          return (
            <TabButton
              key={tab.name}
              tab={tab}
              focused={focused}
              onPress={() => router.push(tab.href as any)}
              onLayout={(x, width) => {
                layouts.current[index] = { x, width };
                if (index === activeIndex) {
                  pillX.value = x;
                  pillW.value = width;
                  pillReady.value = withTiming(1, { duration: 120 });
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

type TabButtonProps = {
  tab: typeof TABS[0];
  focused: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
};

function TabButton({ tab, focused, onPress, onLayout }: TabButtonProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [Colors.text2, Colors.gold]),
    transform: [{ scale: 1 + progress.value * 0.12 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, LABEL_TIMING),
    maxWidth: withSpring(focused ? 80 : 0, SPRING),
    marginLeft: withSpring(focused ? 6 : 0, SPRING),
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        onLayout(x, width);
      }}
    >
      <View style={styles.tabItem}>
        <Animated.Text style={[styles.tabIcon, iconStyle]}>{tab.icon}</Animated.Text>
        <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>
          {tab.label}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => <FloatingTabBar />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scriptures" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,8,6,0.95)',
    borderRadius: 40,
    borderWidth: 0.5,
    borderColor: 'rgba(200,137,42,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(200,137,42,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(200,137,42,0.3)',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  tabIcon: {
    fontSize: 18,
    lineHeight: 20,
  },
  tabLabel: {
    fontFamily: Fonts.cinzel,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.gold,
  },
});
