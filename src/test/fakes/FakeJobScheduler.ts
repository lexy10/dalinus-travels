import type {
  JobScheduler,
  JobName,
  JobPayload,
  ScheduledJob,
  DelayedJobOptions,
  RepeatableJobOptions,
  RetryJobOptions,
} from "@/ports";
import { randomUUID } from "crypto";

export interface RecordedJob {
  readonly id: string;
  readonly name: JobName;
  readonly payload: unknown;
  readonly type: "delayed" | "repeatable" | "retry";
  readonly options: DelayedJobOptions | RepeatableJobOptions | RetryJobOptions;
  cancelled: boolean;
  firedAt: number | null;
}

export class FakeJobScheduler implements JobScheduler {
  readonly jobs: RecordedJob[] = [];
  private virtualNow = 0;

  async scheduleDelayed<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: DelayedJobOptions,
  ): Promise<ScheduledJob> {
    const id = options.jobId ?? randomUUID();
    this.jobs.push({ id, name, payload, type: "delayed", options, cancelled: false, firedAt: null });
    return { jobId: id };
  }

  async scheduleRepeatable<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: RepeatableJobOptions,
  ): Promise<ScheduledJob> {
    const id = options.jobId ?? randomUUID();
    this.jobs.push({ id, name, payload, type: "repeatable", options, cancelled: false, firedAt: null });
    return { jobId: id };
  }

  async scheduleWithRetry<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options: RetryJobOptions,
  ): Promise<ScheduledJob> {
    const id = options.jobId ?? randomUUID();
    this.jobs.push({ id, name, payload, type: "retry", options, cancelled: false, firedAt: null });
    return { jobId: id };
  }

  async cancel(jobId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) job.cancelled = true;
  }

  advanceTime(ms: number): RecordedJob[] {
    this.virtualNow += ms;
    const fired: RecordedJob[] = [];
    for (const job of this.jobs) {
      if (job.cancelled || job.firedAt !== null) continue;
      if (job.type === "delayed") {
        const opts = job.options as DelayedJobOptions;
        if (this.virtualNow >= opts.delayMs) {
          job.firedAt = this.virtualNow;
          fired.push(job);
        }
      }
    }
    return fired;
  }

  get now() { return this.virtualNow; }
  reset() { this.jobs.length = 0; this.virtualNow = 0; }
}
