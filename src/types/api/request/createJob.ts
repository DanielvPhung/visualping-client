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

/**
 * Request body for creating a new monitoring job
 */
export interface CreateJobRequest {
  /** Unique ID of the workspace. Mandatory for business users. */
  workspaceId?: number;

  /**
   * URL of the web page to monitor.
   * @minLength 0
   * @maxLength 2000
   */
  url: string;

  /** MinimalJob description */
  description?: string;

  /** MinimalJob mode */
  mode: JobModeType;

  /** Whether the job is active or paused */
  active: boolean;

  /**
   * MinimalJob's crawling interval expressed in minutes.
   * @example "5", "15", "1440"
   */
  interval: string;

  /**
   * MinimalJob's diff detection trigger expressed in percents.
   * @example "0.1", "25"
   */
  trigger: string;

  /** Optional crop area to use for visual comparison. Dimensions are expressed in pixels. */
  crop?: JobCrop;

  /** Optional proxy to use for this job. Please contact us for details. */
  proxy_id?: number;

  /** Optional xpath representing the root web element to consider for this job. */
  xpath?: string;

  /** Keyword detection mode. Only applicable on text jobs. */
  keyword_action?: JobKeywordAction;

  /** Comma-separated list of keywords. Only applicable on text jobs. */
  keywords?: string;

  /** For internal use. */
  disable_js?: boolean;

  /** Enable cookies and ad blocker */
  enable_cookies_and_ad_blocker?: boolean;

  /**
   * Target device configuration:
   * - `"1"` - Regular desktop crawling of specific area (used with crop)
   * - `"2"` - Mobile
   * - `"3"` - Desktop crawling with special fold extractions
   * - `"4"` - Full page desktop crawling (mostly used with text jobs)
   */
  target_device: TargetDeviceType;

  /** Number of seconds to wait after crawling and before applying any actions on the web page. */
  wait_time: number;

  /** List of actions to run on the web page after crawling. */
  preactions?: LegacyJobPreactions;

  /** Optional advanced schedule for this job. */
  advanced_schedule?: LegacyAdvancedSchedule;

  /** Notification configuration for this job. */
  notification?: NotificationConfig;

  /**
   * Retention period for saving screenshots.
   * @default "3" (3 months)
   */
  retention_policy?: RetentionPolicy;

  /** Setting for alerting users on expected error */
  alert_error?: boolean;

  /** Summarizer/Analyzer settings */
  summalyzer?: JobSummalyzerSettings;

  /** Array of label IDs to attach to this job */
  labelIds?: number[];
}
