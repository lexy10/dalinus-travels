/** Port for durable, time-based, retrying background job scheduling. */

export interface JobPayloadMap {
  readonly "payment.timeout": { readonly bookingId: string };
  readonly "notification.send": { readonly notificationId: string };
  readonly "deadline.reminder.scan": { readonly reminderWindowDays: number };
}

export type JobName = keyof JobPayloadMap;
export type JobPayload<N extends JobName> = JobPayloadMap[N];

export interface ScheduledJob {
  readonly jobId: string;
}

export interface DelayedJobOptions {
  readonly delayMs: number;
  readonly jobId?: string;
}

export interface RepeatSchedule {
  readonly cron?: string;
  readonly everyMs?: number;
}

export interface RepeatableJobOptions {
  readonly schedule: RepeatSchedule;
  readonly jobId?: string;
}

export interface BackoffOptions {
  readonly type: "fixed" | "exponential";
  readonly delayMs: number;
}

export interface RetryJobOptions {
  readonly maxAttempts: number;
  readonly backoff: BackoffOptions;
  readonly delayMs?: number;
  readonly jobId?: string;
}

/** Durable job scheduler supporting delayed, repeatable, and retrying jobs. */
export interface JobScheduler {
  /** Schedule a one-off job to run after a delay. */
  scheduleDelayed<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: DelayedJobOptions,
  ): Promise<ScheduledJob>;

  /** Schedule a recurring job per the given schedule. */
  scheduleRepeatable<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: RepeatableJobOptions,
  ): Promise<ScheduledJob>;

  /** Schedule a job with bounded retry and backoff. */
  scheduleWithRetry<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: RetryJobOptions,
  ): Promise<ScheduledJob>;

  /** Cancel a previously scheduled job by id. Idempotent. */
  cancel(jobId: string): Promise<void>;
}
