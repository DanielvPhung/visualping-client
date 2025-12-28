import {
  JobChange,
  JobCrop,
  JobHistory,
  JobKeywordAction,
  JobMode,
  JobSummalyzerSettings,
  KeywordConfig,
  LegacyAdvancedSchedule,
  LegacyJobPreactions,
  NotificationConfig,
  RetentionPolicy,
  TargetDevice,
} from '../common';

export interface FullJobDetails {
  id: string;
  disable_id: string;
  interval: number;
  customer_id: string;
  error_count: number;
  in_progress: boolean;
  runs: number;
  history: JobHistory[];
  changes: JobChange[];
  notification_threshold: number;
  contentType: string;
  scheduled_at: string;
  last_run: string;
  next_run: string;
  rss_path: string;
  thumb_full: string;
  thumb_150: string;
  favicon: string;
  active: boolean;
  description: string;
  url: string;
  mode: JobMode;
  crop: JobCrop;
  proxy_id: number;
  prompt_id: string | null;
  xpath: string | null;
  keyword_action: JobKeywordAction;
  keyword_config: KeywordConfig;
  keywords: string;
  disable_js: boolean;
  enable_cookies_and_ad_blocker: boolean;
  page_height: any;
  target_device: TargetDevice;
  wait_time: number;
  preactions: LegacyJobPreactions;
  advanced_schedule: LegacyAdvancedSchedule;
  notification: NotificationConfig;
  retention_policy: RetentionPolicy;
  alert_error: boolean;
  summalyzer: JobSummalyzerSettings;
  labelIds: number[];
}
