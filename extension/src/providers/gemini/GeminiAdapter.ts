import { DomAdapterBase } from "../_base/DomAdapterBase";

export class GeminiAdapter extends DomAdapterBase {
  readonly id = "gemini";
  readonly label = "Gemini";
  readonly hosts = ["gemini.google.com"] as const;

  protected turnSelectors = {
    container: 'user-query, model-response, .conversation-container user-query, .conversation-container model-response, [data-test-id*="user"], [data-test-id*="response"]',
    user: 'user-query',
    assistant: 'model-response',
    text: '.query-text, .markdown, message-content, .model-response-text, p, div',
  };

  protected composerSelector = 'rich-textarea div[contenteditable="true"], rich-textarea [contenteditable="true"], div[contenteditable="true"][role="textbox"], textarea';
}
