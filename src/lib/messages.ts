import type { MessageRequest, MessageResponse } from "./types";

export function sendMessage(message: MessageRequest): Promise<MessageResponse> {
  return browser.runtime.sendMessage(message);
}
