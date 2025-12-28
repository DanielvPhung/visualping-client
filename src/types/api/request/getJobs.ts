import { JobMode } from '../common';

export type JobSortBy =
  | 'id_asc'
  | 'id_desc'
  | 'created_asc'
  | 'created_desc'
  | 'lastrun_asc'
  | 'lastrun_desc'
  | 'active_first'
  | 'inactive_first'
  | 'frequency_asc'
  | 'frequency_desc'
  | 'alphabetical_asc'
  | 'alphabetical_desc'
  | 'last_diff_detected_asc'
  | 'last_diff_detected_desc';

export const FrequencyFilter = {
  BELOW_1H_EXCL: 'below_1h_excl',
  _1H: '1h',
  _1H_EXCL_TO_1D_EXCL: '1h_excl_to_1d_excl',
  _1D: '1d',
  _1D_EXCL_TO_500H_EXCL: '1d_excl_to_500h_excl',
  ABOVE_500H_INCL: 'above_500h_incl',
} as const;
export type FrequencyFilter =
  (typeof FrequencyFilter)[keyof typeof FrequencyFilter];

export const EventFilter = {
  CHANGED: 'changed',
  CHANGED_IMPORTANT: 'changedImportant',
  ERRORED: 'errored',
  CHECKED: 'checked',
} as const;
export type EventFilter = (typeof EventFilter)[keyof typeof EventFilter];

export const OutputMode = {
  NORMAL: 'normal',
  COUNTS_ONLY: 'counts_only',
  IDS_ONLY: 'ids_only',
  IDS_AND_WS_IDS: 'ids_and_wsIds',
} as const;
export type OutputMode = (typeof OutputMode)[keyof typeof OutputMode];

export interface GetJobsParams {
  workspaceId?: number;
  mode?: OutputMode;
  pageIndex?: number;
  pageSize?: number;
  activeFilter?: number[];
  modeFilter?: JobMode[];
  frequencyFilter?: FrequencyFilter[];
  hasAdvancedScheduleFilter?: 0 | 1;
  eventFilter?: EventFilter[];
  dateFilter?:
    | 'since_last_login'
    | 'since_yesterday'
    | 'since_last_week'
    | 'since_last_month'
    | 'since_custom_date';
  dateFilterStart?: string;
  fullTextSearchFilter?: string;
  labelsFilter?: number[];
  sortBy?: JobSortBy[];
}
