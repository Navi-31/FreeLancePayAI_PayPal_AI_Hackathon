import { prisma } from "@/backend/db/db";
import { sendEmail, SendEmailOptions } from "./emailService";
import { createNotification } from "./notificationService";
import { recordAuditLog } from "./auditService";

export type BackgroundJobType =
  | "SEND_EMAIL"
  | "CHECK_OVERDUE_INVOICES"
  | "DISPATCH_NOTIFICATION";

export interface EnqueueJobParams {
  userId?: string;
  jobType: BackgroundJobType;
  payload: Record<string, unknown>;
  runAt?: Date;
  priority?: number;
  idempotencyKey?: string;
}

export interface JobExecutionSummary {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
  results: Array<{
    jobId: string;
    jobType: string;
    status: "completed" | "failed" | "retrying";
    error?: string;
  }>;
}

/**
 * Enqueue a new durable background task into Neon PostgreSQL.
 * Deduplicates using idempotencyKey to prevent duplicate queuing.
 */
export async function enqueueJob(params: EnqueueJobParams) {
  if (params.idempotencyKey) {
    const existing = await prisma.backgroundJob.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return existing;
    }
  }

  return prisma.backgroundJob.create({
    data: {
      userId: params.userId,
      jobType: params.jobType,
      payload: JSON.stringify(params.payload),
      status: "pending",
      priority: params.priority ?? 0,
      attempts: 0,
      maxAttempts: 5,
      runAt: params.runAt || new Date(),
      idempotencyKey: params.idempotencyKey,
    },
  });
}

/**
 * Worker execution loop: Processes pending background jobs with optimistic locking,
 * exponential backoff retries, and explicit approval guardrails.
 */
export async function processPendingJobs(options?: {
  limit?: number;
  workerId?: string;
}): Promise<JobExecutionSummary> {
  const limit = options?.limit ?? 10;
  const workerId = options?.workerId ?? `worker_${Date.now()}`;
  const now = new Date();
  const lockTimeoutThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 min stuck threshold

  // 1. Fetch runnable jobs: pending OR stuck in processing from a crashed worker
  const candidateJobs = await prisma.backgroundJob.findMany({
    where: {
      OR: [
        { status: "pending", runAt: { lte: now } },
        { status: "processing", lockedAt: { lte: lockTimeoutThreshold } },
      ],
    },
    orderBy: [{ priority: "desc" }, { runAt: "asc" }],
    take: limit,
  });

  const summary: JobExecutionSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
    results: [],
  };

  for (const job of candidateJobs) {
    summary.processed++;

    // 2. Optimistic locking: transition to 'processing'
    try {
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "processing",
          lockedAt: now,
          lockedBy: workerId,
        },
      });
    } catch {
      // Another worker locked this job concurrently; safely skip
      continue;
    }

    // 3. Execute job task
    try {
      const payload = JSON.parse(job.payload);

      switch (job.jobType) {
        case "SEND_EMAIL": {
          if (!job.userId) {
            throw new Error("Job missing required userId for email dispatch");
          }
          const emailOptions = payload as SendEmailOptions;

          // APPROVAL GUARDRAIL: Never execute automated client outreach without approval
          if (
            (emailOptions.workflow === "payment_reminder" ||
              emailOptions.workflow === "invoice_delivery") &&
            emailOptions.userApproved !== true
          ) {
            throw new Error(
              "Automated email dispatch blocked: explicit user approval required"
            );
          }

          await sendEmail(job.userId, emailOptions);
          break;
        }

        case "CHECK_OVERDUE_INVOICES": {
          // Scans for overdue sent invoices that need reminder drafts
          const overdueInvoices = await prisma.invoice.findMany({
            where: {
              status: "sent",
              dueDate: { lt: now },
            },
            include: { user: true, reminders: true },
            take: 25,
          });

          for (const inv of overdueInvoices) {
            const reminders = Array.isArray(inv.reminders) ? inv.reminders : [];
            const hasPendingOrScheduled = reminders.some(
              (r) => r.status === "pending_approval" || r.status === "scheduled"
            );

            if (!hasPendingOrScheduled) {
              const diffMs = now.getTime() - new Date(inv.dueDate).getTime();
              const overdueDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              const baseCode = `REM-${inv.code.replace("INV-", "")}`;
              const reminderCode =
                reminders.length === 0 ? baseCode : `${baseCode}-W${reminders.length + 1}`;

              // Create DRAFT reminder in 'pending_approval' status.
              // CRITICAL: NEVER automatically send or schedule real dispatch without human signoff!
              await prisma.paymentReminder.create({
                data: {
                  code: reminderCode,
                  userId: inv.userId,
                  invoiceId: inv.id,
                  clientName: inv.clientName,
                  clientEmail: inv.clientEmail,
                  amount: inv.total || 0,
                  currency: inv.currency || "USD",
                  dueDate: inv.dueDate,
                  overdueDays,
                  recommendedTone: overdueDays > 14 ? "firm" : "polite",
                  activeTone: overdueDays > 14 ? "firm" : "polite",
                  status: "pending_approval", // Human-in-the-loop enforced
                  subject: `Follow-up: Overdue Invoice #${inv.code} (${inv.currencySymbol || "$"}${Number(inv.total).toFixed(2)})`,
                  messageBody: `Hi ${inv.clientName},\n\nWe noticed invoice #${inv.code} is currently ${overdueDays} days past its due date. Please confirm when settlement will be executed.\n\nThank you,`,
                  paymentLink: `https://freelancepay.ai/pay/${inv.code}`,
                },
              });

              // Send in-app notification to the freelancer to review and authorize
              await createNotification({
                userId: inv.userId,
                title: `Invoice #${inv.code} is ${overdueDays} days overdue`,
                message: `An AI payment reminder draft is awaiting your explicit review and approval.`,
                type: "approval_needed",
                link: `/reminders`,
                metadata: { invoiceId: inv.id, overdueDays },
              });
            }
          }
          break;
        }

        case "DISPATCH_NOTIFICATION": {
          if (!job.userId) {
            throw new Error("Job missing required userId for notification dispatch");
          }
          await createNotification({
            userId: job.userId,
            title: String(payload.title || "Notification"),
            message: String(payload.message || ""),
            type:
              (payload.type as "info" | "warning" | "success" | "alert" | "approval_needed") ||
              "info",
            link: payload.link ? String(payload.link) : undefined,
            metadata:
              payload.metadata && typeof payload.metadata === "object"
                ? (payload.metadata as Record<string, unknown>)
                : undefined,
          });
          break;
        }

        default:
          throw new Error(`Unsupported background job type: ${job.jobType}`);
      }

      // 4. Mark job as completed
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      });

      summary.succeeded++;
      summary.results.push({
        jobId: job.id,
        jobType: job.jobType,
        status: "completed",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const currentAttempts = typeof job.attempts === "number" ? job.attempts : 0;
      const maxAttempts = typeof job.maxAttempts === "number" ? job.maxAttempts : 5;
      const newAttempts = currentAttempts + 1;

      if (newAttempts < maxAttempts) {
        // Exponential backoff: 30s * 2^attempts
        const backoffSeconds = 30 * Math.pow(2, currentAttempts);
        const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);

        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "pending",
            attempts: newAttempts,
            lastError: errorMessage,
            runAt: nextRunAt,
            lockedAt: null,
            lockedBy: null,
          },
        });

        summary.retried++;
        summary.results.push({
          jobId: job.id,
          jobType: job.jobType,
          status: "retrying",
          error: errorMessage,
        });
      } else {
        // Exhausted max retries: mark as failed
        await prisma.backgroundJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            attempts: newAttempts,
            lastError: errorMessage,
            lockedAt: null,
            lockedBy: null,
          },
        });

        if (job.userId) {
          await recordAuditLog({
            userId: job.userId,
            action: "background_job_failed",
            entityType: "BackgroundJob",
            entityId: job.id,
            details: { jobType: job.jobType, error: errorMessage, attempts: newAttempts },
          });
        }

        summary.failed++;
        summary.results.push({
          jobId: job.id,
          jobType: job.jobType,
          status: "failed",
          error: errorMessage,
        });
      }
    }
  }

  return summary;
}

export async function listJobs(options?: {
  userId?: string;
  status?: string;
  limit?: number;
}) {
  return prisma.backgroundJob.findMany({
    where: {
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });
}
