// app/(app)/reader/[book]/[sectionKey].tsx
// Gita: verse list for a chapter  (with chapter overview card)
// Ramayana: sarga list for a kanda  (with kanda overview card)
// Mahabharata: chapter list for a parva  (with parva overview card)

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton, Topbar } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius, ThemeColors, useThemeColors } from '@/theme';
import type { GitaVerse } from '@/types';
import {
  getGitaChapter,
  getRamayanaSargas,
  getMahabharataChapters,
} from '@/lib/scriptureReader';

// ─── Metadata ─────────────────────────────────────────────────────────────────

const GITA_CHAPTERS: Record<number, {
  name: string; yoga: string; speaker: string;
  verseRange: string; overview: string; keyVerse: string;
}> = {
  1:  {
    name: 'Chapter 1', yoga: 'Arjuna Vishada Yoga', speaker: 'Arjuna & Dhritarashtra',
    verseRange: '1.1 – 1.47', keyVerse: '1.47',
    overview: 'On the battlefield of Kurukshetra, Arjuna surveys both armies and recognises teachers, relatives, and beloved friends. Overcome by grief and compassion, he collapses in his chariot, unable to fight. His despondency becomes the opening of a divine conversation.',
  },
  2:  {
    name: 'Chapter 2', yoga: 'Sankhya Yoga', speaker: 'Krishna & Arjuna',
    verseRange: '2.1 – 2.72', keyVerse: '2.47',
    overview: 'Krishna begins his teaching by declaring the immortality of the soul — no weapon can cut it, no fire burn it. He then introduces Buddhi Yoga: act with full devotion, releasing the fruits of action. The chapter closes with the portrait of the sthitaprajna, the person of steady wisdom.',
  },
  3:  {
    name: 'Chapter 3', yoga: 'Karma Yoga', speaker: 'Krishna',
    verseRange: '3.1 – 3.43', keyVerse: '3.16',
    overview: 'Action cannot be avoided — even inaction is action. Krishna teaches that work done as yajna, as sacred offering without selfish motive, sustains the cosmic order. He warns against the enemy called desire, which shrouds wisdom as smoke shrouds fire.',
  },
  4:  {
    name: 'Chapter 4', yoga: 'Jnana Karma Sanyasa Yoga', speaker: 'Krishna',
    verseRange: '4.1 – 4.42', keyVerse: '4.7',
    overview: 'Krishna reveals the timeless tradition of this knowledge, passed from the sun-god to Manu and beyond. He discloses the mystery of his own birth and action. The fire of knowledge burns all karma. He calls Arjuna to cut doubt with the sword of knowledge and rise.',
  },
  5:  {
    name: 'Chapter 5', yoga: 'Karma Sanyasa Yoga', speaker: 'Krishna',
    verseRange: '5.1 – 5.29', keyVerse: '5.10',
    overview: 'Both the path of renunciation and the path of selfless action lead to the same freedom — the wise see them as one. The Brahmi sthiti, the state of union with Brahman, is available here and now, to those who find it within.',
  },
  6:  {
    name: 'Chapter 6', yoga: 'Dhyana Yoga', speaker: 'Krishna',
    verseRange: '6.1 – 6.47', keyVerse: '6.5',
    overview: 'The chapter of meditation: how to sit, breathe, and still the restless mind. Krishna describes the yogi who has mastered the self as their own friend. Arjuna asks what happens to one who fails on the path. Krishna reassures: no sincere effort is lost.',
  },
  7:  {
    name: 'Chapter 7', yoga: 'Jnana Vijnana Yoga', speaker: 'Krishna',
    verseRange: '7.1 – 7.30', keyVerse: '7.19',
    overview: 'Among thousands of people, only a rare few seek the Divine; among those seekers, only a rare one truly knows. Krishna reveals his lower and higher natures and explains why, veiled by maya, the world does not recognise him.',
  },
  8:  {
    name: 'Chapter 8', yoga: 'Aksara Brahma Yoga', speaker: 'Krishna',
    verseRange: '8.1 – 8.28', keyVerse: '8.5',
    overview: 'On the imperishable Brahman, the cosmic cycles of creation and dissolution, and the moment of death. Whatever one thinks of at the final moment, to that one goes. The yogi who fixes the mind on the Divine crosses beyond rebirth.',
  },
  9:  {
    name: 'Chapter 9', yoga: 'Raja Vidya Raja Guhya Yoga', speaker: 'Krishna',
    verseRange: '9.1 – 9.34', keyVerse: '9.22',
    overview: 'The royal science and royal secret: devotion. Krishna declares himself the father, mother, support and goal of the universe. Even those of low birth can reach the highest — by taking refuge in him with undivided love.',
  },
  10: {
    name: 'Chapter 10', yoga: 'Vibhuti Yoga', speaker: 'Krishna',
    verseRange: '10.1 – 10.42', keyVerse: '10.20',
    overview: 'Krishna enumerates his divine manifestations: among lights he is the sun, among rivers the Ganga, among weapons the thunderbolt. Every excellence anywhere in creation is a spark of his infinite glory. Know this, and all is known.',
  },
  11: {
    name: 'Chapter 11', yoga: 'Vishwarupa Darshana Yoga', speaker: 'Krishna & Arjuna',
    verseRange: '11.1 – 11.55', keyVerse: '11.32',
    overview: 'At Arjuna\'s request, Krishna grants divine sight and reveals his Cosmic Form — infinite heads, infinite eyes, infinite arms, blazing like a thousand suns. Arjuna sees all warriors already slain. Trembling, he asks for the familiar form to be restored.',
  },
  12: {
    name: 'Chapter 12', yoga: 'Bhakti Yoga', speaker: 'Krishna',
    verseRange: '12.1 – 12.20', keyVerse: '12.13',
    overview: 'Devotion is declared the highest path. Krishna tenderly describes his dearest devotee: one who has no hatred for any being, who is compassionate, free from pride, unshaken in pain and pleasure. These qualities are the fruit of genuine surrender.',
  },
  13: {
    name: 'Chapter 13', yoga: 'Kshetra Kshetrajna Vibhaga Yoga', speaker: 'Krishna',
    verseRange: '13.1 – 13.35', keyVerse: '13.2',
    overview: 'The body is the field; the one who knows it is the field-knower. Krishna enumerates the qualities of true knowledge — humility, non-violence, patience, honesty — and distinguishes the perishable from the imperishable.',
  },
  14: {
    name: 'Chapter 14', yoga: 'Gunatraya Vibhaga Yoga', speaker: 'Krishna',
    verseRange: '14.1 – 14.27', keyVerse: '14.19',
    overview: 'The three gunas — tamas (inertia), rajas (passion), sattva (clarity) — bind the soul to the body like cords. The one who transcends all three, who is not disturbed by any quality, becomes fit for immortality.',
  },
  15: {
    name: 'Chapter 15', yoga: 'Purushottama Yoga', speaker: 'Krishna',
    verseRange: '15.1 – 15.20', keyVerse: '15.15',
    overview: 'The parable of the cosmic Ashvattha tree, with roots above and branches below. Cut it with the axe of detachment. Beyond the perishable and the imperishable is the Purushottama, the Supreme Person — that is Krishna himself.',
  },
  16: {
    name: 'Chapter 16', yoga: 'Daivasura Sampad Vibhaga Yoga', speaker: 'Krishna',
    verseRange: '16.1 – 16.24', keyVerse: '16.3',
    overview: 'Two natures: the divine leads to liberation, the demonic to bondage. Fearlessness, purity, compassion, study of scripture — these are divine. Hypocrisy, arrogance, excessive desire — these lead into darkness. Know which qualities you cultivate.',
  },
  17: {
    name: 'Chapter 17', yoga: 'Shraddhatraya Vibhaga Yoga', speaker: 'Krishna',
    verseRange: '17.1 – 17.28', keyVerse: '17.3',
    overview: 'Faith has three kinds according to the predominant guna. Sattvic faith leads to pure worship; rajasic to ostentation; tamasic to delusion. Even food, sacrifice, and austerity take three forms. What one reveres, one becomes.',
  },
  18: {
    name: 'Chapter 18', yoga: 'Moksha Sanyasa Yoga', speaker: 'Krishna',
    verseRange: '18.1 – 18.78', keyVerse: '18.66',
    overview: 'The great culmination. Krishna summarises all teachings and then pronounces the highest secret: abandon all forms of dharma, take refuge in him alone, he will free Arjuna from all sin. The Gita closes with Sanjaya\'s awe at witnessing this supreme dialogue.',
  },
};

const RAMAYANA_KANDAS: Record<number, {
  name: string; subtitle: string; overview: string; sargas: string;
}> = {
  1: {
    name: 'Bala Kanda', subtitle: 'Book of Youth', sargas: '77 sargas',
    overview: 'The world before Rama: the lineage of the Ikshvakus, the grief of Dasaratha without an heir, the sacred fire-rite that yields four divine sons. Rama grows into youth, learns from sage Vishwamitra, kills the demoness Tataka, frees Ahalya from her stone-curse, and in Mithila lifts the mighty bow of Shiva to win Sita as his bride.',
  },
  2: {
    name: 'Ayodhya Kanda', subtitle: 'Book of Ayodhya', sargas: '119 sargas',
    overview: 'The eve of Rama\'s coronation turns into catastrophe. Queen Kaikeyi claims Dasaratha\'s ancient boons: the throne for her son Bharata, exile for Rama. Without a word of protest, Rama accepts. Sita and Lakshmana insist on following. Dasaratha dies of grief. The kingdom mourns. Bharata, horrified at what his mother has done, refuses the throne and places Rama\'s sandals on it.',
  },
  3: {
    name: 'Aranya Kanda', subtitle: 'Book of the Forest', sargas: '75 sargas',
    overview: 'Fourteen years in the Dandaka forest. Sages seek Rama\'s protection from rakshasas. The demoness Surpanakha is humiliated; her brothers Khara and Dushana are slain. Ravana, inflamed by Surpanakha\'s account of Sita\'s beauty, comes disguised as a mendicant and abducts her. The vulture Jatayu fights to his death. Sita is carried to Lanka.',
  },
  4: {
    name: 'Kishkindha Kanda', subtitle: 'Book of Kishkindha', sargas: '67 sargas',
    overview: 'Rama and Lakshmana meet the monkey-sage Hanuman, who recognises them as divine. An alliance is forged with Sugriva, the exiled monkey-king. Rama slays Vali and restores Sugriva to his throne. In return, the vast army of vanaras fans across the earth in search of Sita. It is Hanuman who steps forward to cross the ocean.',
  },
  5: {
    name: 'Sundara Kanda', subtitle: 'Book of Beauty', sargas: '68 sargas',
    overview: 'Hanuman leaps from Mount Mahendra, overcomes all obstacles, and reaches Lanka in the night. He finds Sita in the Ashoka grove — emaciated, guarded by rakshasas, but immovable in her resolve. He delivers Rama\'s ring. Discovered and set on fire, Hanuman uses the flames to burn Lanka before leaping back across the sea with proof of Sita\'s survival.',
  },
  6: {
    name: 'Yuddha Kanda', subtitle: 'Book of War', sargas: '128 sargas',
    overview: 'The ocean submits; a bridge is built. The armies meet. Fierce battles rage across Lanka — Kumbhakarna falls, Meghanada falls. Finally Rama faces Ravana. The demon-king is slain. Sita passes through fire to prove her purity. The divine chariot Pushpaka bears Rama\'s party home to Ayodhya, where the whole kingdom blazes with lamps and joy.',
  },
  7: {
    name: 'Uttara Kanda', subtitle: 'Book of the Future', sargas: '111 sargas',
    overview: 'The aftermath. Citizens whisper about Sita\'s time in Lanka; Rama, as the ideal king, cannot ignore public opinion. Sita is exiled a second time — while pregnant — to Valmiki\'s hermitage. Lava and Kusha are born, raised on the Ramayana itself. The Ashwamedha brings reunion and recognition, but the earth swallows Sita. Rama eventually departs the world.',
  },
};

const MAHABHARATA_PARVAS: Record<number, {
  name: string; subtitle: string; overview: string; chapters: string;
}> = {
  1:  {
    name: 'Adi Parva', subtitle: 'Book of the Beginning', chapters: '~236 chapters',
    overview: 'The origins: Vyasa composes the Mahabharata at Brahma\'s instruction; Ganesha transcribes it. The Kuru lineage is traced from its divine roots. The blind Dhritarashtra and the pale Pandu, their marriages, the unusual births of the Kauravas and Pandavas, their education under Drona, Arjuna\'s supremacy, the burning of the house of lac, and the first exile — all of it sets the wheel in motion.',
  },
  2:  {
    name: 'Sabha Parva', subtitle: 'Book of the Assembly Hall', chapters: '~72 chapters',
    overview: 'Maya the demon builds the radiant Indraprastha. Yudhishthira performs the Rajasuya, humiliating Duryodhana. Shakuni\'s dice are weighted with treachery. Yudhishthira gambles away his kingdom, his brothers, himself, and finally Draupadi. Draupadi\'s terrible humiliation in the assembly hall. The dice are played once more: thirteen years of exile is the sentence.',
  },
  3:  {
    name: 'Vana Parva', subtitle: 'Book of the Forest', chapters: '~313 chapters',
    overview: 'The longest parva. Twelve years of pilgrimage and hardship: the sacred rivers, the stories of Nala and Damayanti, Savitri who reclaimed her husband from Death, Rama\'s own story retold. Arjuna spends years obtaining divine weapons from Indra and Shiva himself. The Yaksha riddles test Yudhishthira. Throughout, the Pandavas are sustained by righteousness and the grace of Krishna.',
  },
  4:  {
    name: 'Virata Parva', subtitle: 'Book of Virata', chapters: '~67 chapters',
    overview: 'The thirteenth year: incognito in the court of King Virata. Yudhishthira becomes a dice-player, Bhima a cook, Arjuna a dance-teacher, the twins stable-keepers, Draupadi a handmaiden. Kichaka discovers Draupadi; Bhima kills him by night. When Duryodhana\'s forces attack Virata, Arjuna alone routs them in his Brihannala disguise.',
  },
  5:  {
    name: 'Udyoga Parva', subtitle: 'Book of the Effort', chapters: '~197 chapters',
    overview: 'Both sides prepare for war. Sanjaya goes as peace envoy; he returns with nothing. Krishna himself travels to Hastinapura as Arjuna\'s ambassador. Duryodhana refuses even five villages. The armies choose their generals. Bhishma takes command. On the night before battle, the Mahabharata war becomes inevitable.',
  },
  6:  {
    name: 'Bhishma Parva', subtitle: 'Book of Bhishma', chapters: '~117 chapters',
    overview: 'The Bhagavad Gita is spoken here — chapters 25 to 42 of this parva. Ten days of battle under Bhishma\'s command. Arjuna cannot bring himself to shoot his grandsire. The Pandavas devise a plan: Shikhandi, whom Bhishma will not fight, leads the charge. Bhishma is pierced by innumerable arrows and falls on a bed of shafts, choosing to die at the auspicious moment.',
  },
  7:  {
    name: 'Drona Parva', subtitle: 'Book of Drona', chapters: '~173 chapters',
    overview: 'Drona commands the Kauravas. He vows to capture Yudhishthira, using the Chakravyuha formation. Young Abhimanyu knows how to enter but not how to exit. He fights with staggering heroism and is slain — unarmed, on foot — by multiple warriors simultaneously. Arjuna\'s vow of vengeance. Karna\'s cruelty. The war loses all pretence of moral order.',
  },
  8:  {
    name: 'Karna Parva', subtitle: 'Book of Karna', chapters: '~96 chapters',
    overview: 'For two days, Karna commands. He fights Arjuna in the climactic duel the whole war has pointed toward. His chariot wheel sinks in mud; he cannot invoke his most powerful weapon; Indra took his armour at birth. Arjuna slays him at Krishna\'s urging, even as Karna stands defenceless. The tragedy of the greatest warrior on the wrong side comes to its end.',
  },
  9:  {
    name: 'Shalya Parva', subtitle: 'Book of Shalya', chapters: '~59 chapters',
    overview: 'Shalya leads the Kauravas on the final day. He is slain by Yudhishthira. Of the Kaurava commanders, only Duryodhana survives. He hides in a lake; drawn out by taunt, he agrees to a mace duel with Bhima. Despite all his skill, Duryodhana falls — Bhima strikes his thigh, honouring an old oath. The Kuru war is over.',
  },
  10: {
    name: 'Sauptika Parva', subtitle: 'Book of the Sleeping Warriors', chapters: '~18 chapters',
    overview: 'A night chapter, terrible and dark. Ashwatthama, Kripacharya and Kritavarma enter the Pandava camp after midnight. Ashwatthama, burning with grief for his father Drona, kills the sleeping warriors — including Draupadi\'s five sons. He fires the Brahmastra at the Pandavas; Arjuna counters it. The curse of Uttara\'s unborn child nearly destroys the Pandava line.',
  },
  11: {
    name: 'Stri Parva', subtitle: 'Book of the Women', chapters: '~27 chapters',
    overview: 'The morning after the battle. Dhritarashtra tries to crush Bhima\'s iron effigy — Krishna had warned Bhima and substituted the statue. Gandhari, whose righteousness could have blessed the Pandavas, instead curses Krishna: as the Pandavas slew their kinsmen, so will Krishna\'s clan perish. Draupadi performs the last rites. The women\'s lament for the fallen is among the most moving passages in all Sanskrit literature.',
  },
  12: {
    name: 'Shanti Parva', subtitle: 'Book of Peace', chapters: '~353 chapters',
    overview: 'The longest single parva. Yudhishthira, weighed down by the deaths he caused, refuses the throne until Bhishma — still alive on his arrow-bed — speaks. For months, Bhishma teaches the science of kings: the duties of rulers, the nature of dharma in various ages, the stories of great souls, and the philosophy of liberation. The Moksha Dharma section explores Samkhya, Yoga, and Vedanta in extraordinary depth.',
  },
  13: {
    name: 'Anushasana Parva', subtitle: 'Book of the Instructions', chapters: '~154 chapters',
    overview: 'Bhishma continues his teachings — on charity, on the proper treatment of all beings, on the sanctity of cows, the greatness of Vishnu. He recites the Vishnu Sahasranama, the thousand names of the Divine, which Yudhishthira receives kneeling. As the sun turns toward the north, Bhishma withdraws his vital breath and departs — witnessed by sages, gods and the Pandavas alike.',
  },
  14: {
    name: 'Ashvamedhika Parva', subtitle: 'Book of the Horse Sacrifice', chapters: '~96 chapters',
    overview: 'To expiate the sin of the war, Yudhishthira performs the Ashvamedha — the great horse sacrifice. The royal horse roams the earth for a year, challenged wherever it goes. Arjuna follows it, fighting wherever necessary. Krishna recounts the Anugita — a second teaching, shorter and more direct. The sacrifice is completed; the kingdom is purified.',
  },
  15: {
    name: 'Ashramavasika Parva', subtitle: 'Book of the Hermitage', chapters: '~47 chapters',
    overview: 'Fifteen years after the war, Dhritarashtra, Gandhari, and Kunti renounce the palace for the forest. The Pandavas visit them there. Vyasa appears and grants the blind king a vision of the dead — all the sons, grandsons and warriors who fell in battle appear, radiant, without enmity. Then, Dhritarashtra and Gandhari perish in a forest fire, attaining liberation.',
  },
  16: {
    name: 'Mausala Parva', subtitle: 'Book of the Clubs', chapters: '~9 chapters',
    overview: 'Thirty-six years after the war. The Yadavas quarrel, inflamed by wine, and destroy each other with clubs fashioned from the cursed grass of Pindasana. Krishna watches without intervening. His brother Balarama departs in meditation. Krishna sits alone in a forest and is killed by a hunter\'s arrow that strikes the sole of his foot — the one vulnerable point. Dwarka sinks into the sea.',
  },
  17: {
    name: 'Mahaprasthanika Parva', subtitle: 'Book of the Great Journey', chapters: '~3 chapters',
    overview: 'The final renunciation. The Pandavas crown Arjuna\'s grandson Parikshit, give away their possessions, and set out on foot toward the Himalayas and Mount Meru. One by one they fall: Draupadi first, then Sahadeva, Nakula, Arjuna, Bhima. Each time, Yudhishthira walks on without turning back. A dog — who has followed from the start — remains beside him.',
  },
  18: {
    name: 'Svargarohana Parva', subtitle: 'Book of the Ascent to Heaven', chapters: '~5 chapters',
    overview: 'Yudhishthira and the dog arrive at the gates of heaven. Indra asks him to abandon the dog. Yudhishthira refuses: the dog has been faithful; he will not abandon the faithful. The dog is revealed to be Dharma himself — his father. In heaven, Yudhishthira finds his enemies in bliss and his brothers in pain, and demands to stay with those who suffer. The final illusion is stripped away: all are revealed in their true divine nature.',
  },
};



// ─── Component ────────────────────────────────────────────────────────────────

export default function SectionScreen() {
  const { book, sectionKey } = useLocalSearchParams<{ book: string; sectionKey: string }>();
  const router     = useRouter();
  const sectionNum = Number(sectionKey);
  const colors  = useThemeColors();
    const styles  = useStyles(colors);
    const BOOK_ACCENT: Record<string, string> = {
  gita:        colors.gitaAccent,
  ramayana:    colors.ramayanaAccent,
  mahabharata: colors.mahabharataAccent,
};
  const accent     = BOOK_ACCENT[book] ?? colors.gold;
  const isGita     = book === 'gita';

  const [loading, setLoading] = useState(true);
  const [verses,  setVerses]  = useState<GitaVerse[]>([]);
  const [units,   setUnits]   = useState<number[]>([]);

  const getMeta = useCallback(() => {
    if (book === 'gita') {
      const c = GITA_CHAPTERS[sectionNum];
      return {
        title:    c?.name    ?? `Chapter ${sectionNum}`,
        subtitle: c?.yoga,
        speaker:  c?.speaker,
        overview: c?.overview,
        verseRange: c?.verseRange,
      };
    }
    if (book === 'ramayana') {
      const k = RAMAYANA_KANDAS[sectionNum];
      return {
        title:    k?.name     ?? `Kanda ${sectionNum}`,
        subtitle: k?.subtitle,
        overview: k?.overview,
        sargas:   k?.sargas,
      };
    }
    const p = MAHABHARATA_PARVAS[sectionNum];
    return {
      title:    p?.name     ?? `Parva ${sectionNum}`,
      subtitle: p?.subtitle,
      overview: p?.overview,
      chapters: p?.chapters,
    };
  }, [book, sectionNum]);

  useEffect(() => {
    setTimeout(() => {
      if (book === 'gita')          setVerses(getGitaChapter(sectionNum));
      else if (book === 'ramayana') setUnits(getRamayanaSargas(sectionNum));
      else                          setUnits(getMahabharataChapters(sectionNum));
      setLoading(false);
    }, 0);
  }, [book, sectionNum]);

  const meta       = getMeta();
  const unitLabel  = book === 'ramayana' ? 'sargas' : 'chapters';
  const count      = isGita ? verses.length : units.length;
  const countLabel = isGita ? `${count} verses` : `${count} ${unitLabel}`;

  // ── Overview card rendered above the list ──────────────────────────────
  const ListHeader = (
    <View>
      {/* ── Chapter / Kanda / Parva overview card ── */}
      <View style={[styles.overviewCard, { borderColor: accent + '22' }]}>
        {/* Top accent line */}
        <View style={[styles.overviewTopBar, { backgroundColor: accent }]} />

        {/* Title block */}
        <View style={styles.overviewTitleRow}>
          <View style={styles.overviewTitleText}>
            <Text style={styles.overviewTitle}>{meta.title}</Text>
            {meta.subtitle ? (
              <Text style={[styles.overviewSubtitle, { color: accent }]}>{meta.subtitle}</Text>
            ) : null}
          </View>
          <View style={[styles.countPill, { borderColor: accent + '40' }]}>
            <Text style={[styles.countPillText, { color: accent }]}>{countLabel}</Text>
          </View>
        </View>

        {/* Extra metadata line */}
        {(meta as any).speaker || (meta as any).verseRange || (meta as any).sargas || (meta as any).chapters ? (
          <View style={styles.overviewMetaRow}>
            {(meta as any).speaker ? (
              <View style={styles.overviewMetaChip}>
                <Text style={[styles.overviewMetaLabel, { color: accent + 'AA' }]}>SPEAKER</Text>
                <Text style={styles.overviewMetaValue}>{(meta as any).speaker}</Text>
              </View>
            ) : null}
            {(meta as any).verseRange ? (
              <View style={styles.overviewMetaChip}>
                <Text style={[styles.overviewMetaLabel, { color: accent + 'AA' }]}>VERSES</Text>
                <Text style={styles.overviewMetaValue}>{(meta as any).verseRange}</Text>
              </View>
            ) : null}
            {(meta as any).sargas ? (
              <View style={styles.overviewMetaChip}>
                <Text style={[styles.overviewMetaLabel, { color: accent + 'AA' }]}>LENGTH</Text>
                <Text style={styles.overviewMetaValue}>{(meta as any).sargas}</Text>
              </View>
            ) : null}
            {(meta as any).chapters ? (
              <View style={styles.overviewMetaChip}>
                <Text style={[styles.overviewMetaLabel, { color: accent + 'AA' }]}>LENGTH</Text>
                <Text style={styles.overviewMetaValue}>{(meta as any).chapters}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Divider */}
        <View style={[styles.overviewDivider, { backgroundColor: accent + '18' }]} />

        {/* Overview prose */}
        {meta.overview ? (
          <Text style={styles.overviewBody}>{meta.overview}</Text>
        ) : null}
      </View>

      {/* ── List section label ── */}
      <View style={[styles.listSectionLabel, { borderBottomColor: accent + '18' }]}>
        <Text style={[styles.listSectionText, { color: accent }]}>
          {isGita ? 'Verses' : book === 'ramayana' ? 'Sargas' : 'Chapters'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar
        left={<BackButton onPress={() => router.back()} />}
        title={meta.title}
        subtitle={meta.subtitle}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={accent} size="small" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : isGita ? (

        // ── Gita: verse list ──────────────────────────────────────────────
        <FlatList<GitaVerse>
          data={verses}
          keyExtractor={(v) => v.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          renderItem={({ item: verse, index }) => (
            <TouchableOpacity
              style={styles.verseRow}
              activeOpacity={0.72}
              onPress={() => router.push({
                pathname: '/(app)/reader/verse' as any,
                params: { book, id: verse.id, sectionKey, verseIndex: String(index) },
              })}
            >
              <Text style={[styles.verseNum, { color: accent }]}>
                {String(verse.verse).padStart(2, '0')}
              </Text>
              <View style={styles.verseContent}>
                <Text style={styles.verseEnglish} numberOfLines={3}>
                  {verse.english}
                </Text>
                {verse.sanskrit ? (
                  <Text style={styles.verseSanskrit} numberOfLines={1}>
                    {verse.sanskrit}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.chevron, { color: accent + '70' }]}>›</Text>
            </TouchableOpacity>
          )}
        />

      ) : (

        // ── Ramayana / Mahabharata: sub-unit list ─────────────────────────
        <FlatList<number>
          data={units}
          keyExtractor={(n) => String(n)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          renderItem={({ item: unitNum, index }) => {
            const label = book === 'ramayana'
              ? `Sarga ${unitNum}`
              : `Chapter ${unitNum}`;
            return (
              <TouchableOpacity
                style={styles.unitRow}
                activeOpacity={0.72}
                onPress={() => router.push({
                  pathname: '/(app)/reader/[book]/[sectionKey]/[unitKey]' as any,
                  params: { book, sectionKey, unitKey: String(unitNum) },
                })}
              >
                <Text style={[styles.unitNum, { color: accent }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.unitLabel}>{label}</Text>
                <Text style={[styles.chevron, { color: accent + '70' }]}>›</Text>
              </TouchableOpacity>
            );
          }}
        />

      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function useStyles(c: ThemeColors) {
  return useMemo(() =>  StyleSheet.create({
  safe:    { flex: 1, backgroundColor: c.bg0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md, color: c.text2,
  },
  list: { paddingBottom: 48 },

  // ── Overview card ─────────────────────────────────────────────────────
  overviewCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: 4,
    borderWidth: 0.5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: c.bg1,
  },
  overviewTopBar: {
    height: 3, width: '100%',
  },
  overviewTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4,
    gap: 12,
  },
  overviewTitleText: { flex: 1 },
  overviewTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.lg,
    color: c.text0, letterSpacing: 0.4, marginBottom: 4,
  },
  overviewSubtitle: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    letterSpacing: 0.2,
  },
  countPill: {
    borderWidth: 0.5, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200,137,42,0.04)',
  },
  countPillText: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 1,
  },
  overviewMetaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  overviewMetaChip: { gap: 2 },
  overviewMetaLabel: {
    fontFamily: Fonts.cinzel, fontSize: 8, letterSpacing: 1.5,
  },
  overviewMetaValue: {
    fontFamily: Fonts.garamond, fontSize: FontSize.sm, color: c.text1,
  },
  overviewDivider: {
    height: 0.5, marginHorizontal: 18, marginVertical: 4,
  },
  overviewBody: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md,
    color: c.text1, lineHeight: 30,
    paddingHorizontal: 18, paddingBottom: 18, paddingTop: 8,
  },

  // ── List section label ─────────────────────────────────────────────────
  listSectionLabel: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    marginTop: 12,
  },
  listSectionText: {
    fontFamily: Fonts.cinzel, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
  },

  // ── Verse rows (Gita) ─────────────────────────────────────────────────
  verseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, paddingRight: Spacing.xl,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.06)',
  },
  verseNum: {
    fontFamily: Fonts.cinzelBold, fontSize: 13,
    letterSpacing: 0.5, width: 44, textAlign: 'right', flexShrink: 0,
  },
  verseContent: { flex: 1 },
  verseEnglish: {
    fontFamily: Fonts.garamond, fontSize: FontSize.md,
    color: c.text0, lineHeight: 25, marginBottom: 5,
  },
  verseSanskrit: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.xs,
    color: c.text2, lineHeight: 18,
  },

  // ── Sub-unit rows (Ramayana / Mahabharata) ────────────────────────────
  unitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 17, paddingRight: Spacing.xl,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.06)',
  },
  unitNum: {
    fontFamily: Fonts.cinzelBold, fontSize: 13,
    letterSpacing: 0.5, width: 44, textAlign: 'right', flexShrink: 0,
  },
  unitLabel: {
    flex: 1, fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: c.text0, letterSpacing: 0.3,
  },

  chevron: { fontFamily: Fonts.garamond, fontSize: 20, lineHeight: 22 },
}), [c]);
}

