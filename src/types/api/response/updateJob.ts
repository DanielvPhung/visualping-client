export const JobUpdateImpact = {
  NON_BREAKING_ONLY: 'non-breaking-only',
  NONE: 'none',
  PREVIEW_BREAKING: 'preview-breaking',
  RENDER_BREAKING: 'render-breaking',
} as const;
export type JobUpdateImpact =
  (typeof JobUpdateImpact)[keyof typeof JobUpdateImpact];

export interface EstimatedConsumption {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface UpdateJobDetails {
  updates: JobUpdateImpact;
  estimatedConsumption: EstimatedConsumption;
  result?: {
    jobId: number;
    impact: JobUpdateImpact;
  };
}
