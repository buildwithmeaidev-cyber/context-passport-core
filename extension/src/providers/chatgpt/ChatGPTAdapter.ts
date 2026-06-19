import { DomAdapterBase } from "../_base/DomAdapterBase";

export class ChatGPTAdapter extends DomAdapterBase {
  readonly id = "chatgpt";
  readonly label = "ChatGPT";
  readonly hosts = ["chatgpt.com", "chat.openai.com"] as const;

  protected turnSelectors = {
    container: '[data-message-author-role]',
    user: '[data-message-author-role="user"]',
    assistant: '[data-message-author-role="assistant"]',
    text: '.markdown, [data-message-author-role]',
  };

  protected composerSelector = '#prompt-textarea, textarea[data-id], div[contenteditable="true"]';
}
