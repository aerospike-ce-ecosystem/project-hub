export interface PrStatsData {
  generatedAt: string;
  org: string;
  earliest: string | null;
  latest: string | null;
  totalPrs: number;
  repos: string[];
  perRepoTotal: Record<string, number>;
  weeksAxis: string[];
  weeksKorean: string[];
  weeksDateRange: string[];
  repoSeries: Record<string, number[]>;
  totalPerWeek: number[];
  recent4Weeks: string[];
  recent4Total: number;
  peakWeek: {week: string; korean: string; count: number} | null;
  avgPerWeek: number;
  stateCounts: Record<string, number>;
  topContributors: {name: string; count: number}[];
  monthly: {month: string; count: number}[];
  recentPrs: {
    repo: string;
    number: number;
    title: string;
    url: string;
    author: string;
    createdAt: string;
    state: string;
  }[];
}
