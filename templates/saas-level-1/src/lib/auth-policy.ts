export function assertProductionProviders(
  nodeEnv: string,
  providerCount: number
): void {
  if (nodeEnv === 'production' && providerCount === 0) {
    throw new Error(
      '[auth] FATAL: No authentication providers configured in production. ' +
        'Set environment variables for at least one provider (GitHub or Google). ' +
        'Application startup aborted.'
    )
  }
}

export function isValidAuthSecret(nodeEnv: string, secret: string): boolean {
  return nodeEnv !== 'production' || secret.length >= 32
}
