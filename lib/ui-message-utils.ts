import { type Message, type MessagePart } from "./db/schema";

export type UIMessage = {
  id: string;
  role: string;
  content: string;
  parts: MessagePart[];
  createdAt?: Date;
};

function getTextContent(message: Message): string {
  // Extract text from parts for backward compatibility
  if (message.parts && Array.isArray(message.parts)) {
    const textPart = message.parts.find((p: MessagePart) => p.type === "text" && p.text);
    return textPart?.text || "";
  }
  return "";
}

export function convertToUIMessages(dbMessages: Array<Message>): Array<UIMessage> {
  return dbMessages.map((message) => {
    let parts: MessagePart[] = [];
    if (typeof message.parts === "string") {
      try {
        parts = JSON.parse(message.parts);
      } catch {
        parts = [];
      }
    } else if (Array.isArray(message.parts)) {
      parts = message.parts;
    }
    return {
      id: message.id,
      parts,
      role: message.role as string,
      content: getTextContent(message),
      createdAt: message.createdAt,
    };
  });
}
