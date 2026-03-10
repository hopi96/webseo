import Anthropic from '@anthropic-ai/sdk';
import type { Message, TextBlock } from '@anthropic-ai/sdk/resources/messages';

const DEFAULT_CLAUDE_MODEL =
  process.env.CONTENT_GENERATION_MODEL ||
  process.env.CLAUDE_MODEL ||
  'claude-3-5-sonnet-20240620';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const isTextBlock = (block: { type: string }): block is TextBlock => block.type === 'text';

export const getClaudeModel = (): string => DEFAULT_CLAUDE_MODEL;

export const requireAnthropic = (): Anthropic => {
  if (!anthropic) {
    throw new Error('Claude non configuré. Veuillez définir la variable ANTHROPIC_API_KEY.');
  }
  return anthropic;
};

export const extractClaudeText = (message: Message): string => {
  return message.content
    .filter(isTextBlock)
    .map(block => block.text)
    .join('')
    .trim();
};
