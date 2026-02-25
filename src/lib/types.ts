export interface SubtitleCue {
  start: number; // seconds
  end: number;
  text: string;
  translation?: string;
}

export interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name: { simpleText: string };
}

export type WordStatus = "learning" | "mastered";

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export interface Card {
  id: string;
  front: string;
  back: string;
  createdAt: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SourceContext {
  type: string
  url?: string
  videoId?: string
  title?: string
  timestamp?: number
  context?: string
  highlightWord?: string
  [key: string]: unknown
}

export interface SourceAdapter {
  getContext(): SourceContext
}

// Message types between content script and background
export type MessageRequest =
  | { type: "FETCH_SUBTITLES"; url: string; videoId: string }
  | { type: "TRANSLATE"; texts: string[]; videoId: string; lang: string }
  | { type: "LOOKUP_WORD"; word: string }
  | { type: "SAVE_CARD"; deckId: string; front: string; back: string }
  | { type: "CAPTURE_WORD"; word: string; definition: string; phonetic?: string; audioUrl?: string; source: SourceContext }
  | { type: "GET_VOCAB_WORDS" }
  | { type: "GET_DECKS" }
  | { type: "CREATE_DECK"; title: string }
  | { type: "GET_AUTH_STATE" }
  | { type: "LOGIN"; email: string; password: string }
  | { type: "LOGOUT" };

export type MessageResponse =
  | { success: true; data: unknown }
  | { success: false; error: string };
