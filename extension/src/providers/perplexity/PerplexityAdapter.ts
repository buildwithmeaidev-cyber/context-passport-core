import { DomAdapterBase } from "../_base/DomAdapterBase";

export class PerplexityAdapter extends DomAdapterBase {
  readonly id = "perplexity";
  readonly label = "Perplexity";
  readonly hosts = ["www.perplexity.ai", "perplexity.ai"] as const;

  protected turnSelectors = {
    container: '[class*="prose"], .prose, article, [data-testid*="message"]',
    user: '[class*="user"], [data-testid*="user"]',
    assistant: '[class*="answer"], [data-testid*="answer"], .prose',
    text: 'p, div',
  };

  protected composerSelector = 'textarea[placeholder*="Ask"], textarea[placeholder*="follow"], div[contenteditable="true"]';
}
