import { ID_TOKEN_REFRESH_MS, REFRESH_TOKEN_REFRESH_MS } from './constants';
import { VisualpingApiError } from './error';
import { MinimalJob } from './types/api/common';
import { QueryParams } from './types/api/request';
import { CreateJobRequest } from './types/api/request/createJob';
import { GetJobsParams, OutputMode } from './types/api/request/getJobs';
import { UpdateJobRequest } from './types/api/request/updateJob';
import {
  PasswordRefreshResp,
  TokenRefreshResp,
} from './types/api/response/auth.types';
import { CreatedJobResult } from './types/api/response/createJob';
import { DeleteJobResult } from './types/api/response/deleteJob';
import { VisualpingUser, Workspace } from './types/api/response/describeUser';
import { FullJobDetails } from './types/api/response/getJob';
import {
  JobsCountsOnlyResponse,
  JobsIdsAndWsIdsResponse,
  JobsIdsOnlyResponse,
  JobsNormalResponse,
} from './types/api/response/getJobs';
import { UpdateJobDetails } from './types/api/response/updateJob';

/**
 * Visualping API Client
 *
 * TypeScript client for interacting with the Visualping API (v2).
 * Handles authentication, token refresh, and provides typed access to all API endpoints.
 *
 * @example
 * ```typescript
 * const client = new VisualpingClient('user@example.com', 'password');
 *
 * // Get user details
 * const user = await client.describeUser();
 *
 * // List jobs
 * const jobs = await client.getJobs();
 *
 * // Create a job
 * const job = await client.createJob({
 *   url: 'https://example.com',
 *   mode: 'visual',
 *   active: true,
 *   interval: '60',
 *   trigger: '0.1',
 *   target_device: '1',
 *   wait_time: 0
 * });
 * ```
 *
 * @see https://api.visualping.io/doc.html for API documentation
 */
export class VisualpingClient {
  #baseUrlV2: string = 'https://api.visualping.io/v2';
  #accountBaseUrl: string = 'https://account.api.visualping.io';
  #jobBaseUrl = 'https://job.api.visualping.io/v2';
  private email: string;
  private password: string;
  private authInFlight: Promise<void> | null = null;

  private refreshToken: string | null = null;
  private idToken: string | null = null;

  private lastRefreshTokenRefresh: Date | null = null;
  private lastIdTokenRefresh: Date | null = null;

  constructor(
    email: string,
    password: string,
    private timeoutMs: number = 30000
  ) {
    this.email = email;
    this.password = password;
  }

  // --------------------
  // PRIVATE METHODS
  // --------------------

  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Base request handler - makes HTTP calls and handles errors
   */
  private async baseRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let payload: any = undefined;
        try {
          payload = await response.json();
        } catch {
          const text = await response.text();
          throw new VisualpingApiError(
            response.status,
            text || response.statusText
          );
        }
        const msg =
          payload?.message ?? payload?.code ?? JSON.stringify(payload);
        throw new VisualpingApiError(response.status, msg, payload);
      }
      return response.json() as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new VisualpingApiError(408, 'Request timeout');
      }
      throw err;
    }
  }

  /**
   * Authenticated request - ensures auth before making request
   * Technically, visualping only defines
   * 400, 403, and 500 level errors for its api calls.
   */
  private async authenticatedRequest<T>(
    endpoint: string,
    options?: RequestInit,
    retries = 2
  ): Promise<T> {
    await this.ensureAuthenticated();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined),
      ...(this.idToken ? { Authorization: `Bearer ${this.idToken}` } : {}),
    };

    let attempt = 0;
    // tiny backoff: 200ms, 400ms
    const backoffMs = (n: number) => 200 * 2 ** n;

    while (true) {
      try {
        return await this.baseRequest<T>(endpoint, { ...options, headers });
      } catch (err) {
        attempt++;

        const status =
          err instanceof VisualpingApiError ? err.status : undefined;

        const isTransient =
          status === 429 ||
          (status !== undefined && status >= 500 && status <= 599);

        // fetch threw before we got a response
        const isNetworkError = status === undefined;

        // 400/401/403 etc. -> immediate fail
        if (attempt > retries || (!isTransient && !isNetworkError)) {
          throw err;
        }

        await new Promise((r) => setTimeout(r, backoffMs(attempt - 1)));
      }
    }
  }

  private withWorkspace(workspaceId?: number | string): string {
    return workspaceId !== undefined
      ? this.buildQueryString({ workspaceId })
      : '';
  }

  private async passwordAuthFlow(): Promise<void> {
    const response = await this.baseRequest<PasswordRefreshResp>(
      `${this.#baseUrlV2}/token`,
      {
        method: 'POST',
        body: JSON.stringify({
          method: 'PASSWORD',
          email: this.email,
          password: this.password,
        }),
      }
    );

    this.idToken = response.id_token;
    this.refreshToken = response.refresh_token;
  }

  private async refreshTokenAuthFlow(): Promise<void> {
    const response = await this.baseRequest<TokenRefreshResp>(
      `${this.#baseUrlV2}/token`,
      {
        method: 'POST',
        body: JSON.stringify({
          method: 'REFRESH_TOKEN',
          refreshToken: this.refreshToken,
        }),
      }
    );

    this.idToken = response.id_token;
  }

  private isRefreshTokenValid(): boolean {
    if (this.refreshToken === null) return false;
    if (this.lastRefreshTokenRefresh === null) return false;

    const now = new Date();
    return (
      now.getTime() - this.lastRefreshTokenRefresh.getTime() <
      REFRESH_TOKEN_REFRESH_MS
    );
  }

  private isIdTokenValid(): boolean {
    if (this.idToken === null) return false;
    if (this.lastIdTokenRefresh === null) return false;

    const now = new Date();
    return (
      now.getTime() - this.lastIdTokenRefresh.getTime() < ID_TOKEN_REFRESH_MS
    );
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.authInFlight) return this.authInFlight;

    this.authInFlight = (async () => {
      if (!this.isRefreshTokenValid()) {
        await this.passwordAuthFlow();
        this.lastRefreshTokenRefresh = new Date();
        this.lastIdTokenRefresh = new Date();
        return;
      }

      if (!this.isIdTokenValid()) {
        await this.refreshTokenAuthFlow();
        this.lastIdTokenRefresh = new Date();
      }
    })();

    try {
      await this.authInFlight;
    } finally {
      this.authInFlight = null;
    }
  }

  // --------------------
  // PUBLIC METHODS
  // --------------------

  /**
   * Retrieve details about the currently authenticated user
   *
   * Returns account-level information including user type, subscription
   * details, and workspace access.
   *
   * @returns Promise resolving to the authenticated user's details
   *
   * @example
   * const user = await client.describeUser();
   */
  async describeUser(): Promise<VisualpingUser> {
    return this.authenticatedRequest<VisualpingUser>(
      `${this.#accountBaseUrl}/describe-user`
    );
  }

  /**
   * Retrieve monitoring jobs for the authenticated account
   *
   * Supports multiple output modes to control the shape of the response.
   * The response type is determined by the provided `mode` parameter.
   *
   * If `mode` is omitted, `OutputMode.NORMAL` is used by default.
   *
   * For business users, `workspaceId` may be required depending on account configuration.
   *
   * @param params - Optional query parameters used to filter jobs and control output format
   * @param params.mode - Output format mode determining the response shape
   *
   * @returns Promise resolving to job data based on the selected output mode
   *
   * @example
   * // Default mode (full job objects)
   * const jobs = await client.getJobs();
   *
   * @example
   * // Explicit normal mode
   * const jobs = await client.getJobs({ mode: OutputMode.NORMAL });
   *
   * @example
   * // IDs only
   * const ids = await client.getJobs({ mode: OutputMode.IDS_ONLY });
   *
   * @example
   * // Job IDs and workspace IDs
   * const idsAndWorkspaces = await client.getJobs({
   *   mode: OutputMode.IDS_AND_WS_IDS
   * });
   *
   * @example
   * // Counts only
   * const counts = await client.getJobs({
   *   mode: OutputMode.COUNTS_ONLY
   * });
   */
  async getJobs(
    params?: GetJobsParams & { mode?: undefined }
  ): Promise<JobsNormalResponse>;
  async getJobs(
    params: GetJobsParams & { mode: typeof OutputMode.NORMAL }
  ): Promise<JobsNormalResponse>;
  async getJobs(
    params: GetJobsParams & { mode: typeof OutputMode.IDS_ONLY }
  ): Promise<JobsIdsOnlyResponse>;
  async getJobs(
    params: GetJobsParams & { mode: typeof OutputMode.IDS_AND_WS_IDS }
  ): Promise<JobsIdsAndWsIdsResponse>;
  async getJobs(
    params: GetJobsParams & { mode: typeof OutputMode.COUNTS_ONLY }
  ): Promise<JobsCountsOnlyResponse>;
  async getJobs(
    jobParams: GetJobsParams = {} as GetJobsParams
  ): Promise<
    | JobsNormalResponse
    | JobsIdsOnlyResponse
    | JobsIdsAndWsIdsResponse
    | JobsCountsOnlyResponse
  > {
    const finalParams: QueryParams = {
      ...jobParams,
      mode: jobParams.mode ?? OutputMode.NORMAL,
    };

    const queryString = this.buildQueryString(finalParams);
    return this.authenticatedRequest<
      | JobsNormalResponse
      | JobsIdsOnlyResponse
      | JobsIdsAndWsIdsResponse
      | JobsCountsOnlyResponse
    >(`${this.#jobBaseUrl}/jobs${queryString}`);
  }

  /**
   * Create a new monitoring job
   *
   * Creates a new job with the provided configuration and begins monitoring
   * once the job is active.
   *
   * For business users, `workspaceId` is mandatory.
   *
   * @param jobData - Full job configuration payload
   * @returns Promise resolving to created job details
   *
   * @example
   * // Personal user - minimal required fields
   * const job = await client.createJob({
   *   url: 'https://example.com',
   *   description: 'Homepage monitor',
   *   mode: JobMode.TEXT,
   *   active: true,
   *   interval: '120',
   *   trigger: '0.1',
   *   target_device: TargetDevice.DESKTOP,
   *   wait_time: 0
   * });
   *
   * @example
   * // Business user with workspace
   * const job = await client.createJob({
   *   workspaceId: 456,
   *   url: 'https://example.com',
   *   description: 'Business job',
   *   mode: JobMode.VISUAL,
   *   active: true,
   *   interval: '120',
   *   trigger: '1',
   *   target_device: TargetDevice.DESKTOP,
   *   wait_time: 5
   * });
   *
   */
  async createJob(jobData: CreateJobRequest): Promise<CreatedJobResult> {
    return this.authenticatedRequest<CreatedJobResult>(
      `${this.#jobBaseUrl}/jobs`,
      {
        method: 'POST',
        body: JSON.stringify(jobData),
      }
    );
  }

  /**
   * Get detailed information about a specific job
   *
   * @param jobId - The ID of the job to retrieve
   * @param workspaceId - The workspace ID. Mandatory for business users.
   * @returns Promise resolving to full job details
   *
   * @example
   * // Personal user
   * const job = await client.getJob(123);
   *
   * @example
   * // Business user
   * const job = await client.getJob(123456, 456);
   */
  async getJob(
    jobId: number | string,
    workspaceId?: number | string
  ): Promise<FullJobDetails> {
    return this.authenticatedRequest<FullJobDetails>(
      `${this.#jobBaseUrl}/jobs/${jobId}${this.withWorkspace(workspaceId)}`
    );
  }

  /**
   * Update an existing job's configuration
   *
   * All fields in the update request are optional - only send the fields you want to change.
   *
   * @param jobId - The ID of the job to update
   * @param jobData - Partial job configuration to update. For business users, workspaceId and organisationId are mandatory.
   * @returns Promise resolving to update details including estimated consumption
   *
   * @example
   * // Update description and interval
   * await client.updateJob(123, {
   *   description: 'Updated description',
   *   interval: '30',
   *   active: true
   * });
   *
   * @example
   * // Update notification settings
   * await client.updateJob(123, {
   *   notification: {
   *     enableEmailAlert: true,
   *     enableSmsAlert: false,
   *     onlyImportantAlerts: true,
   *     config: { ... }
   *   }
   * });
   *
   * @example
   * // Business user - must include workspaceId and organisationId
   * await client.updateJob(123, {
   *   workspaceId: 456,
   *   organisationId: 789,
   *   description: 'Updated by business user'
   * });
   */
  async updateJob(
    jobId: number | string,
    jobData: UpdateJobRequest
  ): Promise<UpdateJobDetails> {
    return this.authenticatedRequest<UpdateJobDetails>(
      `${this.#jobBaseUrl}/jobs/${jobId}`,
      {
        method: 'PUT',
        body: JSON.stringify(jobData),
      }
    );
  }

  /**
   * Delete an existing job
   *
   * Permanently removes the job and stops all monitoring and notifications
   * associated with it.
   *
   * For business users, `workspaceId` is mandatory.
   *
   * @param jobId - The ID of the job to delete
   * @param workspaceId - The workspace ID. Mandatory for business users.
   * @returns Promise resolving to deletion result details
   *
   * @example
   * // Personal user
   * await client.deleteJob(123);
   *
   * @example
   * // Business user
   * await client.deleteJob(123456, 456);
   */
  async deleteJob(
    jobId: number | string,
    workspaceId?: number | string
  ): Promise<DeleteJobResult> {
    return this.authenticatedRequest<DeleteJobResult>(
      `${this.#jobBaseUrl}/jobs/${jobId}${this.withWorkspace(workspaceId)}`,
      { method: 'DELETE' }
    );
  }

  // --------------------
  // EXTENDED API METHODS
  // Client-side methods that enhance the core API
  // --------------------

  /**
   * Retrieve all monitoring jobs across all pages (client-side convenience)
   *
   * This method automatically walks the paginated `/v2/jobs` endpoint and
   * aggregates all job results into a single array.
   *
   * @param params - Optional job query parameters. All filters supported by
   * the `/v2/jobs` endpoint may be used. Pagination fields (`pageIndex`) and
   * `mode` are managed internally.
   *
   * @returns Promise resolving to an array of all matching jobs
   *
   * @example
   * ```ts
   * const jobs = await client.getAllJobs({
   *   modeFilter: [JobMode.TEXT]
   * });
   *
   * ```
   */
  async getAllJobs(
    params: Omit<GetJobsParams, 'mode' | 'pageIndex'> = {}
  ): Promise<MinimalJob[]> {
    const pageSize = params.pageSize ?? 100;

    let pageIndex = 0;
    let totalPages = 1;
    const out: MinimalJob[] = [];

    while (pageIndex < totalPages) {
      const resp = await this.getJobs({
        ...params,
        mode: OutputMode.NORMAL,
        pageIndex,
        pageSize,
      });

      out.push(...resp.jobs);
      totalPages = resp.totalPages;
      pageIndex += 1;
    }

    return out;
  }

  /**
   * Return the workspaces available to the authenticated user.
   *
   * @returns Promise resolving to the user's workspaces
   *
   * @example
   * ```ts
   * const workspaces = await client.getWorkspaces();
   * ```
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const user = await this.describeUser();
    return user.workspaces;
  }

  /**
   * Pause multiple jobs by setting them to inactive.
   *
   * @param jobIds - List of job IDs to pause
   * @param params - Optional business parameters required for business accounts
   *
   * @example
   * ```ts
   * await client.pauseJobs([123, 456]);
   * ```
   *
   * @example
   * ```ts
   * // Business user
   * await client.pauseJobs([123, 456], {
   *   workspaceId: 10,
   *   organisationId: 20
   * });
   * ```
   */
  async pauseJobs(
    jobIds: Array<number | string>,
    params?: Pick<UpdateJobRequest, 'workspaceId' | 'organisationId'>
  ): Promise<void> {
    for (const jobId of jobIds) {
      await this.updateJob(jobId, {
        ...params,
        active: false,
      });
    }
  }
}
