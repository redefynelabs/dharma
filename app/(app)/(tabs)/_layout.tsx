import { Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Home, BookOpen, Sparkles, User } from 'lucide-react-native';
import { Fonts, ThemeColors, useThemeColors } from '@/theme';

const SPRING = { damping: 22, stiffness: 280, mass: 0.9 };
const LABEL_TIMING = { duration: 180, easing: Easing.out(Easing.quad) };

const TABS = [
  { name: 'index', icon: Home, label: 'Home', href: '/(app)/(tabs)/' },
  { name: 'scriptures', icon: BookOpen, label: 'Scriptures', href: '/(app)/(tabs)/scriptures' },
  { name: 'chat', icon: Sparkles, label: 'Wisdom', href: '/(app)/(tabs)/chat' },
  { name: 'profile', icon: User, label: 'Profile', href: '/(app)/(tabs)/profile' },
] as const;

function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const pillReady = useSharedValue(0);

  const layouts = useRef<{ x: number; width: number }[]>([]);

  const activeIndex = (() => {
    const i = TABS.findIndex((t) => {
      if (t.name === 'index') {
        return (
          pathname === '/' ||
          pathname === '/index' ||
          pathname.endsWith('/(tabs)/') ||
          pathname.endsWith('/(tabs)')
        );
      }
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
      {/* Gradient */}
      <LinearGradient
        colors={['transparent', colors.overlayLight, colors.overlay]}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />

      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />

        {TABS.map((tab, index) => {
          const focused = index === activeIndex;

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
  tab: typeof TABS[number];
  focused: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
};

function TabButton({ tab, focused, onPress, onLayout }: TabButtonProps) {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.12 }],
    opacity: 0.8 + progress.value * 0.2,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, LABEL_TIMING),
    maxWidth: withSpring(focused ? 80 : 0, SPRING),
    marginLeft: withSpring(focused ? 6 : 0, SPRING),
  }));

  const Icon = tab.icon;

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
        <Animated.View style={iconStyle}>
          <Icon
            size={18}
            color={focused ? colors.gold : colors.text2}
            strokeWidth={focused ? 2.5 : 2}
          />
        </Animated.View>

        <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>
          {tab.label}
        </Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <FloatingTabBar />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scriptures" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: c.overlay,
          borderRadius: 40,
          borderWidth: 1,
          borderColor: c.goldBorder,
          paddingHorizontal: 8,
          paddingVertical: 8,
          gap: 4,

          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 12,
        },

        pill: {
          position: 'absolute',
          top: 8,
          bottom: 8,
          left: 0,
          borderRadius: 32,
          backgroundColor: c.goldFaint,
          borderWidth: 1,
          borderColor: c.goldBorder,
        },

        tabItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          overflow: 'hidden',
        },

        tabLabel: {
          fontFamily: Fonts.cinzel,
          fontSize: 11,
          letterSpacing: 1,
          color: c.gold,
        },
      }),
    [c]
  );
}