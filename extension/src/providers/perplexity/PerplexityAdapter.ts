import { DomAdapterBase } from "../_base/DomAdapterBase";

export class PerplexityAdapter extends DomAdapterBase {
  readonly id = "perplexity";
  readonly label = "Perplexity";
  readonly hosts = ["www.perplexity.ai", "perplexity.ai"] as const;

  protected turnSelectors = {
    container: 'article, [data-testid*="message"], [data-testid*="answer"], .prose, [class*="prose"]',
    user: '[class*="user"], [data-testid*="user"], [data-testid*="query"]',
    assistant: '[class*="answer"], [data-testid*="answer"], .prose, [class*="prose"]',
    text: '.prose, [class*="prose"], p, div',
  };

  protected composerSelector = 'textarea[placeholder*="Ask"], textarea[placeholder*="follow"], textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="true"]';
}
