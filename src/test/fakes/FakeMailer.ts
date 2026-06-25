import type { Mailer, MailMessage, MailSendResult, MailDeliveryError } from "@/ports";
import type { Result } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";

export class FakeMailer implements Mailer {
  readonly sent: MailMessage[] = [];
  private failSequence: number[] = [];
  private callCount = 0;

  /**
   * Configure a failure sequence. E.g., `setFailSequence([1, 2])` means the
   * 1st and 2nd calls will fail, subsequent calls succeed.
   */
  setFailSequence(failOnCalls: number[]) {
    this.failSequence = failOnCalls;
    this.callCount = 0;
  }

  async send(message: MailMessage): Promise<Result<MailSendResult, MailDeliveryError>> {
    this.callCount++;
    if (this.failSequence.includes(this.callCount)) {
      return err({ message: "Simulated delivery failure.", retryable: true });
    }
    this.sent.push(message);
    return ok({ providerMessageId: `msg-${this.callCount}` });
  }

  reset() {
    this.sent.length = 0;
    this.failSequence = [];
    this.callCount = 0;
  }
}
