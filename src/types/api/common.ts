export interface MinimalJob {
  id: number;
  url: string;
  description: string;
  isActive: boolean;
  faviconKey: string;
  mode: JobMode;
  inProgress: boolean;

  workspaceId?: number;
  labelIds?: number[];

  notificationThreshold: number;
  interval: number;
  isSpiderJob?: boolean;
}

export type JobKeywordAction = 'ALL' | 'ADDED' | 'DELETED';
export type KeywordType = 'REGEX' | 'EXACT';
export type RetentionPolicy = '3' | '12';
export type FeedbackType = 'GOOD' | 'BAD';
export type ChangeTarget = 'DIFF' | 'SUMMARY';
export type ImportantDefinitionType = 'custom' | 'default';
export type NotificationType =
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'discord'
  | 'slack_app'
  | 'google_sheets'
  | 'google_chat';

export interface JobCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SuggestedTargetXpath {
  parent: string;
  'strict-move': string;
  'xpath-match': string;
}

export interface Diff {
  nodePercentDiff: number;
  areaPercentDiff: number;
  wordPercentDiff: number;
  pixelPercentDiff: number;
  suggestedTargetXpath: SuggestedTargetXpath;
  VISUAL: number;
  TEXT: number;
}

export interface JobHistory {
  image: string;
  image_uncropped: string;
  screenshot_id: string;
  crop_dimensions: string;
  PercentDifference: number;
  diff: Diff;
  process_log_id: string;
  error_log_id: string;
  error_message: string;
  error_label: string;
  created: string;
  notification_send: boolean;
  process_id: string;
  process_created: string;
  initial: boolean;
  mode: JobMode;
}

export interface ChangeFeedback {
  DIFF: FeedbackType;
  SUMMARY: FeedbackType;
}

export interface JobChange {
  mode: JobMode;
  created: string;
  id: string;
  process_id: number;
  PercentDifference: number;
  diff: Diff;
  thumb_diff_full: string;
  thumb_diff_90: string;
  htmlDiffUrl: string;
  target: ChangeTarget;
  feedback: ChangeFeedback;
  englishSummary: string;
  analyzerAlertTriggered: boolean;
}

export interface KeywordConfigItem {
  keyword: string;
  action: JobKeywordAction;
  type: KeywordType;
}

export interface KeywordConfig {
  list: KeywordConfigItem[];
}

export interface LegacyJobPreAction {
  [key: string]: any;
}

export interface LegacyJobPreactions {
  active?: boolean;
  actions?: LegacyJobPreAction[];
}

export interface LegacyAdvancedSchedule {
  stop_time: number; // 0-24
  start_time: number; // 0-24
  active_days: number[]; // 1-7 for days of week
}

export interface NotificationChannelConfig {
  url: string;
  active: boolean;
  notificationType: NotificationType;
  channels: string[];
}

export interface NotificationConfigChannels {
  slack: NotificationChannelConfig;
  teams: NotificationChannelConfig;
  webhook: NotificationChannelConfig;
  discord: NotificationChannelConfig;
  slack_app: NotificationChannelConfig;
  google_sheets: NotificationChannelConfig;
  google_chat: NotificationChannelConfig;
}

export interface NotificationConfig {
  enableSmsAlert: boolean;
  enableEmailAlert: boolean;
  onlyImportantAlerts: boolean;
  config: NotificationConfigChannels;
}

export const TargetDevice = {
  DESKTOP: '1',
  MOBILE: '2',
  TABLET: '3',
  ALL: '4',
} as const;
export type TargetDevice = (typeof TargetDevice)[keyof typeof TargetDevice];

export const JobMode = {
  VISUAL: 'VISUAL',
  WEB: 'WEB',
  TEXT: 'TEXT',
} as const;
export type JobMode = (typeof JobMode)[keyof typeof JobMode];

export interface JobSummalyzerSettings {
  importantDefinition?: string;
  importantDefinitionType?: 'custom' | 'none' | 'default';
}
