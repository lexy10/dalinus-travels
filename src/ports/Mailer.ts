/** Port for transactional email delivery. */
import type { Result } from "@domain/kernel";

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
  readonly from?: string;
  readonly replyTo?: string;
}

export interface MailSendResult {
  readonly providerMessageId?: string;
}

export interface MailDeliveryError {
  readonly message: string;
  readonly retryable?: boolean;
}

/** Transactional email sender with Result-based delivery reporting. */
export interface Mailer {
  /** Attempt to deliver a single transactional email. */
  send(message: MailMessage): Promise<Result<MailSendResult, MailDeliveryError>>;
}
