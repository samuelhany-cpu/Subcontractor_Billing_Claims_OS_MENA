export type BalanceConversationState = {
  readonly telegramChatId: string;
  readonly conversationId: string;
  readonly intent: 'QUERY_BALANCE';
  readonly step: 'SELECT_PROJECT' | 'READY';
  readonly projectId?: string;
  readonly collectedJson: '{}';
  readonly revision: number;
  readonly expiresAt: string;
  readonly lastUpdateId: string;
};

export function beginBalanceConversation(
  telegramChatId: string,
  updateId: number,
  now = new Date(),
): BalanceConversationState {
  return {
    telegramChatId,
    conversationId: crypto.randomUUID(),
    intent: 'QUERY_BALANCE',
    step: 'SELECT_PROJECT',
    collectedJson: '{}',
    revision: 1,
    expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
    lastUpdateId: String(updateId),
  };
}

export function acceptBalanceUpdate(
  state: BalanceConversationState,
  updateId: number,
  now = new Date(),
): boolean {
  return (
    now < new Date(state.expiresAt) &&
    BigInt(updateId) > BigInt(state.lastUpdateId)
  );
}
