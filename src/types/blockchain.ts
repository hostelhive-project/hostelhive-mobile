export interface BlockchainVerifyRecord {
  hash: string;
  blockRef: string;
  network: string;
  explorerUrl: string | null;
  writtenAt?: string;
  status?: 'Pending' | 'Confirmed' | 'Simulated';
  sourceMatches?: boolean;
  snapshotMatches?: boolean | null;
  onChainVerified?: boolean;
  verificationState?: 'Verified' | 'Simulated' | 'Pending' | 'Unavailable' | 'Mismatch';
}
