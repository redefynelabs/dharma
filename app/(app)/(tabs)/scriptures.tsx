import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Topbar } from '@/components/UI';
import {
  useThemeColors,
  ThemeColors,
  Fonts,
  FontSize,
  Spacing,
  Radius,
} from '@/theme';

const { width, height } = Dimensions.get('window');

const GAP = 12;

// 🔥 dynamic height
const CARD_H = height * 0.4;

// width for grid
const TILE_W = (width - Spacing.xl * 2 - GAP) / 2;

export default function ScripturesScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useStyles(c);

  const DATA = useMemo(() => [
    {
      id: 'gita',
      cover: require('@/assets/bhagavad_gita.png'),
      name: 'Bhagavad Gita',
      subtitle: 'The Song of God',
      accent: c.gitaAccent,
    },
    {
      id: 'ramayana',
      cover: require('@/assets/ramayana.png'),
      name: 'Ramayana',
      subtitle: 'The Path of Dharma',
      accent: c.ramayanaAccent,
    },
    {
      id: 'mahabharata',
      cover: require('@/assets/mahabarata.png'),
      name: 'Mahabharata',
      subtitle: 'The Great War',
      accent: c.mahabharataAccent,
    },
  ], [c]);

  function open(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(app)/scripture/[id]', params: { id } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Topbar title="Scriptures" subtitle="Sacred knowledge" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >

        {/* 🔥 HERO */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => open(DATA[0].id)}
          style={[styles.hero, { height: 500 }]}
        >
          <ImageBackground
            source={DATA[0].cover}
            style={styles.cover}
            imageStyle={styles.image}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', c.overlayLight, c.overlay]}
              locations={[0, 0.55, 1]}
              style={styles.overlay}
            />

            <View style={styles.content}>
              <Text style={[styles.title, { color: DATA[0].accent }]}>
                {DATA[0].name}
              </Text>
              <Text style={styles.subtitle}>
                {DATA[0].subtitle}
              </Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* 🔥 GRID */}
        <View style={styles.row}>
          {DATA.slice(1).map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.92}
              onPress={() => open(item.id)}
              style={[styles.tile, { height: CARD_H }]}
            >
              <ImageBackground
                source={item.cover}
                style={styles.cover}
                imageStyle={styles.image}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['transparent', c.overlayLight, c.overlay]}
                  locations={[0, 0.55, 1]}
                  style={styles.overlay}
                />

                <View style={styles.contentSmall}>
                  <Text style={[styles.titleSmall, { color: item.accent }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.subtitleSmall}>
                    {item.subtitle}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔥 SHARE BANNER */}
        <TouchableOpacity activeOpacity={0.9} style={styles.banner}>
          <LinearGradient
            colors={[c.goldFaint, 'transparent']}
            style={styles.bannerInner}
          >
            <Text style={styles.bannerTitle}>
              Share wisdom with your friends
            </Text>
            <Text style={styles.bannerSub}>
              Invite others to explore dharma
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg0,
    },

    container: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 10,
      paddingBottom: 100,
      gap: 16,
    },

    hero: {
      width: '100%',
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: c.goldBorder,
    },

    row: {
      flexDirection: 'row',
      gap: GAP,
    },

    tile: {
      width: TILE_W,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: c.goldBorder,
    },

    cover: {
      flex: 1,
      justifyContent: 'flex-end',
    },

    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
    },

    content: {
      padding: 18,
      gap: 6,
    },

    contentSmall: {
      padding: 14,
      gap: 4,
    },

    title: {
      fontFamily: Fonts.cinzelBold,
      fontSize: 22,
    },

    subtitle: {
      fontFamily: Fonts.garamondItalic,
      fontSize: 14,
      color: c.text1,
    },

    titleSmall: {
      fontFamily: Fonts.cinzelBold,
      fontSize: 14,
    },

    subtitleSmall: {
      fontFamily: Fonts.garamondItalic,
      fontSize: 11,
      color: c.text1,
    },

    banner: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: c.goldBorder,
    },

    bannerInner: {
      padding: 18,
      gap: 6,
    },

    bannerTitle: {
      fontFamily: Fonts.cinzelBold,
      fontSize: 14,
      color: c.text0,
    },

    bannerSub: {
      fontFamily: Fonts.garamond,
      fontSize: 12,
      color: c.text2,
    },
  });
}