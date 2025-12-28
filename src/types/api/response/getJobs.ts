import { MinimalJob } from '../common';

export type JobIdsByWsId = {
  /** Unique ID of the workspace. Mandatory for business users. */
  workspaceId: number;
  ids: number[];
};

export type JobsMeta = {
  totalJobs: number;
  activeJobCount: number;
  pageSize: number;
  totalPages: number;
  pageIndex: number;
};

export type JobsNormalResponse = JobsMeta & {
  jobs: MinimalJob[];
};

export type JobsIdsOnlyResponse = JobsMeta & {
  jobIds: number[];
};

export type JobsIdsAndWsIdsResponse = JobsMeta & {
  jobIdsByWsId: JobIdsByWsId[];
};

export type JobsCountsOnlyResponse = JobsMeta;
