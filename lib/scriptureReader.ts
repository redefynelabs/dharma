// lib/scriptureReader.ts
// Lazy-loads per-section scripture data. Each section file is only parsed
// when first accessed, keeping initial memory footprint low.

import type { GitaVerse, RamayanaVerse, MahabharataVerse } from '@/types';

// ─── Gita (2.1 MB – loaded once) ───────────────────────────────────────────

let _gita: GitaVerse[] | null = null;
function getGita(): GitaVerse[] {
  if (!_gita) _gita = require('@/data/bhagavad_gita.json') as GitaVerse[];
  return _gita;
}

export function getGitaChapter(chapter: number): GitaVerse[] {
  return getGita().filter((v) => v.chapter === chapter);
}

export function getGitaVerse(chapter: number, verse: number): GitaVerse | undefined {
  return getGita().find((v) => v.chapter === chapter && v.verse === verse);
}

export function getGitaVerseById(id: string): GitaVerse | undefined {
  return getGita().find((v) => v.id === id);
}

// ─── Ramayana (per-kanda lazy loading) ─────────────────────────────────────

const RAMAYANA_LOADERS: Record<number, () => RamayanaVerse[]> = {
  1: () => require('@/data/ramayana/kanda_1.json'),
  2: () => require('@/data/ramayana/kanda_2.json'),
  3: () => require('@/data/ramayana/kanda_3.json'),
  4: () => require('@/data/ramayana/kanda_4.json'),
  5: () => require('@/data/ramayana/kanda_5.json'),
  6: () => require('@/data/ramayana/kanda_6.json'),
  7: () => require('@/data/ramayana/kanda_7.json'),
};

const _ramayanaCache: Record<number, RamayanaVerse[]> = {};
function getRamayanaKanda(kandaNumber: number): RamayanaVerse[] {
  if (!_ramayanaCache[kandaNumber]) {
    _ramayanaCache[kandaNumber] = RAMAYANA_LOADERS[kandaNumber]?.() ?? [];
  }
  return _ramayanaCache[kandaNumber];
}

export function getRamayanaSargas(kandaNumber: number): number[] {
  const verses = getRamayanaKanda(kandaNumber);
  const sargas = [...new Set(verses.map((v) => v.sarga))].sort((a, b) => a - b);
  return sargas;
}

export function getRamayanaSargaVerses(kandaNumber: number, sarga: number): RamayanaVerse[] {
  return getRamayanaKanda(kandaNumber).filter((v) => v.sarga === sarga);
}

export function getRamayanaVerseById(id: string): RamayanaVerse | undefined {
  for (const kn of Object.keys(RAMAYANA_LOADERS).map(Number)) {
    const found = getRamayanaKanda(kn).find((v) => v.id === id);
    if (found) return found;
  }
  return undefined;
}

// ─── Mahabharata (per-parva lazy loading) ──────────────────────────────────

const MAHABHARATA_LOADERS: Record<number, () => MahabharataVerse[]> = {
  1: () => require('@/data/mahabharata/parva_1.json'),
  2: () => require('@/data/mahabharata/parva_2.json'),
  3: () => require('@/data/mahabharata/parva_3.json'),
  4: () => require('@/data/mahabharata/parva_4.json'),
  5: () => require('@/data/mahabharata/parva_5.json'),
  6: () => require('@/data/mahabharata/parva_6.json'),
  7: () => require('@/data/mahabharata/parva_7.json'),
  8: () => require('@/data/mahabharata/parva_8.json'),
  9: () => require('@/data/mahabharata/parva_9.json'),
  10: () => require('@/data/mahabharata/parva_10.json'),
  11: () => require('@/data/mahabharata/parva_11.json'),
  12: () => require('@/data/mahabharata/parva_12.json'),
  13: () => require('@/data/mahabharata/parva_13.json'),
  14: () => require('@/data/mahabharata/parva_14.json'),
  15: () => require('@/data/mahabharata/parva_15.json'),
  16: () => require('@/data/mahabharata/parva_16.json'),
  17: () => require('@/data/mahabharata/parva_17.json'),
  18: () => require('@/data/mahabharata/parva_18.json'),
};

const _mahabharataCache: Record<number, MahabharataVerse[]> = {};
function getMahabharataParva(parvaNumber: number): MahabharataVerse[] {
  if (!_mahabharataCache[parvaNumber]) {
    _mahabharataCache[parvaNumber] = MAHABHARATA_LOADERS[parvaNumber]?.() ?? [];
  }
  return _mahabharataCache[parvaNumber];
}

export function getMahabharataChapters(parvaNumber: number): number[] {
  const verses = getMahabharataParva(parvaNumber);
  const chapters = [...new Set(verses.map((v) => v.chapter))].sort((a, b) => a - b);
  return chapters;
}

export function getMahabharataChapterVerses(parvaNumber: number, chapter: number): MahabharataVerse[] {
  return getMahabharataParva(parvaNumber).filter((v) => v.chapter === chapter);
}

export function getMahabharataVerseById(id: string): MahabharataVerse | undefined {
  for (const pn of Object.keys(MAHABHARATA_LOADERS).map(Number)) {
    const found = getMahabharataParva(pn).find((v) => v.id === id);
    if (found) return found;
  }
  return undefined;
}

// ─── Generic by ID ─────────────────────────────────────────────────────────

export function getVerseById(id: string) {
  if (id.startsWith('gita_')) return getGitaVerseById(id);
  if (id.startsWith('ramayana_')) return getRamayanaVerseById(id);
  if (id.startsWith('mahabharata_')) return getMahabharataVerseById(id);
  return undefined;
}
