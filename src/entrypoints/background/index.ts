import type { MessageRequest, MessageResponse } from "@/lib/types";
import { fetchSubtitles } from "./subtitles";
import { translateTexts } from "./translator";
import { lookupWord } from "./dictionary";
import {
  login,
  logout,
  getAuthState,
  getCollections,
  createCollection,
  saveCard,
} from "./api";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (
      message: MessageRequest,
      _sender: browser.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      handleMessage(message).then(sendResponse);
      return true; // Keep message channel open for async response
    }
  );
});

async function handleMessage(
  message: MessageRequest
): Promise<MessageResponse> {
  try {
    switch (message.type) {
      case "FETCH_SUBTITLES": {
        const cues = await fetchSubtitles(message.url);
        return { success: true, data: cues };
      }
      case "TRANSLATE": {
        const translations = await translateTexts(
          message.texts,
          message.videoId,
          message.lang
        );
        return { success: true, data: translations };
      }
      case "LOOKUP_WORD": {
        const entry = await lookupWord(message.word);
        return { success: true, data: entry };
      }
      case "SAVE_CARD": {
        await saveCard(message.collectionId, message.front, message.back);
        return { success: true, data: null };
      }
      case "GET_COLLECTIONS": {
        const collections = await getCollections();
        return { success: true, data: collections };
      }
      case "CREATE_COLLECTION": {
        const collection = await createCollection(message.title);
        return { success: true, data: collection };
      }
      case "GET_AUTH_STATE": {
        const state = await getAuthState();
        return { success: true, data: state };
      }
      case "LOGIN": {
        const result = await login(message.email, message.password);
        return { success: true, data: result };
      }
      case "LOGOUT": {
        await logout();
        return { success: true, data: null };
      }
      default:
        return { success: false, error: "Unknown message type" };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
