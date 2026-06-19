import { DomAdapterBase } from "../_base/DomAdapterBase";

export class ClaudeAdapter extends DomAdapterBase {
  readonly id = "claude";
  readonly label = "Claude";
  readonly hosts = ["claude.ai"] as const;

  protected turnSelectors = {
    container: '[data-testid="user-message"], [data-testid="assistant-message"], .font-claude-message, .font-user-message',
    user: '[data-testid="user-message"], .font-user-message',
    assistant: '[data-testid="assistant-message"], .font-claude-message',
    text: 'p, div',
  };

  protected composerSelector = 'div[contenteditable="true"][role="textbox"], div.ProseMirror[contenteditable="true"]';
}
