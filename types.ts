export enum ScrapeStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface Source {
  title: string;
  uri: string;
}

export interface ScrapeResult {
  title: string;
  summary: string;
  keywords: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  mainEntities: string[];
  estimatedReadingTimeMinutes: number;
  sources?: Source[];
}

export interface ScrapeTask {
  id: string;
  url: string;
  createdAt: number;
  status: ScrapeStatus;
  result?: ScrapeResult;
  error?: string;
}

export type ViewState = 'dashboard' | 'scraper' | 'history';