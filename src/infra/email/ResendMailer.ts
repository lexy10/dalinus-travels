/**
 * Resend-backed Mailer.
 *
 * Falls back to a console-logging stub when `RESEND_API_KEY` is unset so the
 * app boots without an email provider configured. The Mailer port returns
 * `Result<...>` so the NotificationService retry logic still works in stub mode.
 */
import { Resend } from "resend";
import type {
  Mailer,
  MailMessage,
  MailSendResult,
  MailDeliveryError,
} from "@/ports/Mailer";
import type { Result } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";

export class ResendMailer implements Mailer {
  private readonly client: Resend | null;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.client = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = process.env.EMAIL_FROM ?? "noreply@dalinus.travel";
  }

  async send(message: MailMessage): Promise<Result<MailSendResult, MailDeliveryError>> {
    if (!this.client) {
      // Stub mode: log + report success so dev flows aren't blocked
      // eslint-disable-next-line no-console
      console.info(`[ResendMailer stub] to=${message.to} subject=${message.subject}`);
      return ok({ providerMessageId: "stub" });
    }
    try {
      const result = await this.client.emails.send({
        from: message.from ?? this.fromAddress,
        to: message.to,
        subject: message.subject,
        text: message.text ?? message.html ?? "",
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      });
      if (result.error) {
        return err({ message: result.error.message, retryable: true });
      }
      return ok({ providerMessageId: result.data?.id });
    } catch (error) {
      return err({
        message: error instanceof Error ? error.message : "Unknown email error.",
        retryable: true,
      });
    }
  }
}
