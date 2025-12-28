import {
  JobCrop,
  JobKeywordAction,
  JobModeType,
  JobSummalyzerSettings,
  LegacyAdvancedSchedule,
  LegacyJobPreactions,
  NotificationConfig,
  RetentionPolicy,
  TargetDeviceType,
} from '../common';

export interface UpdateJobRequest {
  /** Unique ID of the workspace. Mandatory for business users. */
  workspaceId?: number;
  /** Unique ID of the organisation. Mandatory for business users. */
  organisationId?: number;

  // Job identity
  jobId?: number;

  // Basic info
  url?: string; // 0-2000 characters
  description?: string;
  mode?: JobModeType;
  active?: boolean;

  // Timing (note: strings in API, not numbers)
  interval?: string; // Examples: "5", "15", "1440" (minutes)
  trigger?: string; // Examples: "0.1", "25" (percent)

  // Configuration
  crop?: JobCrop | null;
  proxy_id?: number | null;
  prompt_id?: string | null;
  xpath?: string | null;

  // Keywords
  keyword_action?: JobKeywordAction;
  keywords?: string;

  // Browser settings
  disable_js?: boolean;
  enable_cookies_and_ad_blocker?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- documented as any in Visualping docs
  page_height?: any;
  target_device?: TargetDeviceType;
  wait_time?: number;

  // Advanced settings
  preactions?: LegacyJobPreactions;
  advanced_schedule?: LegacyAdvancedSchedule | null;
  notification?: NotificationConfig;
  retention_policy?: RetentionPolicy | null;
  alert_error?: boolean;
  summalyzer?: JobSummalyzerSettings;
  labelIds?: number[] | null;
}
