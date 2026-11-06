-- AlterTable
ALTER TABLE "milestones" ADD COLUMN "paypalOrderId" TEXT;
ALTER TABLE "milestones" ADD COLUMN "paypalAuthorizationId" TEXT;
ALTER TABLE "milestones" ADD COLUMN "paypalCaptureId" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "paypalInvoiceId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "paypalOrderId" TEXT;
ALTER TABLE "invoices" ADD COLUMN "paypalCaptureId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "paypalOrderId" TEXT;
ALTER TABLE "transactions" ADD COLUMN "paypalCaptureId" TEXT;
ALTER TABLE "transactions" ADD COLUMN "paypalRefundId" TEXT;

-- CreateTable
CREATE TABLE "paypal_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "paypal_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paypal_webhook_events_eventId_key" ON "paypal_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "paypal_webhook_events_eventType_idx" ON "paypal_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "paypal_webhook_events_createdAt_idx" ON "paypal_webhook_events"("createdAt");
