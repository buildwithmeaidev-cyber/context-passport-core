import { DomAdapterBase } from "../_base/DomAdapterBase";

export class ChatGPTAdapter extends DomAdapterBase {
  readonly id = "chatgpt";
  readonly label = "ChatGPT";
  readonly hosts = ["chatgpt.com", "chat.openai.com"] as const;

  protected turnSelectors = {
    container: '[data-message-author-role], article[data-testid^="conversation-turn"]',
    user: '[data-message-author-role="user"]',
    assistant: '[data-message-author-role="assistant"]',
    text: '.markdown, [data-message-author-role] .whitespace-pre-wrap, [data-message-author-role], article',
  };

  protected composerSelector = '#prompt-textarea, [contenteditable="true"][id="prompt-textarea"], textarea[data-id], div.ProseMirror[contenteditable="true"], div[contenteditable="true"][role="textbox"]';
}
