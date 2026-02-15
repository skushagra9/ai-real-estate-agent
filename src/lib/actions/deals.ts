"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  generateReferenceNumber,
  STAGE_TRANSITIONS,
  BROKER_GROSS_COMMISSION_RATE,
  getStageInfo,
} from "@/lib/constants";
import { sendEmail, type SendEmailOptions } from "@/lib/email";
import {
  DealStage,
  DealEventType,
  EventVisibility,
  DealLenderStatus,
  CommissionStatus,
  LoanType,
  TransactionType,
  LoanPosition,
  PropertyType,
  Occupancy,
} from "@prisma/client";

async function resolveActorId(sessionUser: { id?: string; email?: string | null }): Promise<string | undefined> {
  if (!sessionUser.email) return undefined;
  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });
  return user?.id ?? undefined;
}

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getBaseUrlForEmail(): string {
  const url = process.env.EMAIL_APP_URL?.trim() || getBaseUrl();
  if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
    console.warn(
      "[Email] EMAIL_APP_URL is not set; links in emails point to localhost and may land in spam. Set EMAIL_APP_URL to your production URL (e.g. https://yourdomain.com)."
    );
  }
  return url;
}

async function notifyPartner(
  partnerEmail: string,
  subject: string,
  dealRef: string,
  message: string,
  dealId: string
) {
  const baseUrl = getBaseUrlForEmail();
  const dealUrl = `${baseUrl}/partner/deals/${dealId}`;
  const result = await sendEmail({
    to: partnerEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Deal Update — ${dealRef}</h2>
        <p>${message}</p>
        <p style="margin: 24px 0;">
          <a href="${dealUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Deal</a>
        </p>
        <p style="color: #666; font-size: 14px;">— LoanFlow</p>
      </div>
    `,
  });
  if (!result.ok) {
    console.error("[Partner notification]", result.error);
  }
}

async function notifyBorrower(
  borrowerEmail: string,
  borrowerFirstName: string,
  subject: string,
  message: string,
  trackingUrl: string
) {
  const name = borrowerFirstName || "there";
  const textBody = `Hi ${name},\n\n${message}\n\nTrack your application: ${trackingUrl}\n\n— LoanFlow`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Your loan application</h2>
      <p style="margin-bottom: 12px;">Hi ${name},</p>
      <p style="margin-bottom: 24px;">${message}</p>
      <p style="margin-bottom: 24px;">
        <a href="${trackingUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">View your status</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">— LoanFlow</p>
    </div>
  `;
  const result = await sendEmail({
    to: borrowerEmail,
    subject,
    html: htmlBody,
    text: textBody,
  });
  if (!result.ok) {
    console.error("[Borrower notification]", result.error);
  }
}

export async function createDeal(formData: {
  loanType: string;
  transactionType: string;
  loanPosition: string;
  propertyType: string;
  occupancy: string;
  propertyAddress: string;
  purchasePrice: number | null;
  noi: number | null;
  noiNotAvailable: boolean;
  signedPurchaseAgreement: boolean;
  inPlaceOccupancy: number | null;
  loanAmountRequested: number;
  targetLtv: number | null;
  estimatedCloseDate: string | null;
  recourseAcceptance: boolean;
  partnerCompensation: number | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  enableClientTracking: boolean;
}): Promise<{
  dealId: string;
  referenceNumber: string;
  borrowerAccessToken: string;
  enableClientTracking: boolean;
}> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PARTNER" || !session.user.partnerId) {
    throw new Error("Unauthorized — only partners can submit deals");
  }

  const nameParts = formData.clientName.trim().split(/\s+/);
  const firstName = nameParts[0] || "Client";
  const lastName = nameParts.slice(1).join(" ") || "";

  const partner = await prisma.partner.findUnique({
    where: { id: session.user.partnerId },
    select: { id: true, defaultCommissionPct: true },
  });
  if (!partner) throw new Error("Partner not found");

  let referenceNumber = generateReferenceNumber();
  let exists = await prisma.deal.findUnique({ where: { referenceNumber }, select: { id: true } });
  while (exists) {
    referenceNumber = generateReferenceNumber();
    exists = await prisma.deal.findUnique({ where: { referenceNumber }, select: { id: true } });
  }

  const borrower = await prisma.borrower.create({
    data: {
      firstName,
      lastName,
      email: formData.clientEmail.trim(),
      phone: formData.clientPhone.trim() || "",
    },
  });

  const deal = await prisma.deal.create({
    data: {
      referenceNumber,
      partnerId: partner.id,
      borrowerId: borrower.id,
      loanType: formData.loanType as LoanType,
      transactionType: formData.transactionType as TransactionType,
      loanPosition: (formData.loanPosition || "FIRST_MORTGAGE") as LoanPosition,
      propertyType: formData.propertyType as PropertyType,
      occupancy: (formData.occupancy || "INVESTMENT") as Occupancy,
      propertyAddress: formData.propertyAddress?.trim() || null,
      purchasePrice: formData.purchasePrice,
      noi: formData.noi,
      noiNotAvailable: formData.noiNotAvailable,
      signedPurchaseAgreement: formData.signedPurchaseAgreement,
      inPlaceOccupancy: formData.inPlaceOccupancy,
      loanAmountRequested: formData.loanAmountRequested,
      targetLtv: formData.targetLtv,
      estimatedCloseDate: formData.estimatedCloseDate ? new Date(formData.estimatedCloseDate) : null,
      recourseAcceptance: formData.recourseAcceptance,
      partnerCompensation: formData.partnerCompensation,
      enableClientTracking: formData.enableClientTracking,
    },
  });

  const partnerPct = formData.partnerCompensation ?? partner.defaultCommissionPct;
  await prisma.commission.create({
    data: {
      dealId: deal.id,
      partnerId: partner.id,
      partnerPct,
      status: CommissionStatus.ESTIMATED,
      grossCommission: formData.loanAmountRequested * BROKER_GROSS_COMMISSION_RATE,
      partnerAmount: formData.loanAmountRequested * BROKER_GROSS_COMMISSION_RATE * partnerPct,
    },
  });

  const actorId = await resolveActorId(session.user);
  await prisma.dealEvent.create({
    data: {
      dealId: deal.id,
      actorId: actorId ?? undefined,
      eventType: DealEventType.STAGE_CHANGE,
      toStage: DealStage.SUBMITTED,
      visibility: EventVisibility.INTERNAL,
    },
  });

  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/deals/new");
  revalidatePath("/admin/dashboard");

  return {
    dealId: deal.id,
    referenceNumber: deal.referenceNumber,
    borrowerAccessToken: deal.borrowerAccessToken,
    enableClientTracking: deal.enableClientTracking,
  };
}

export async function updateDealStage(
  dealId: string,
  newStage: string,
  reason?: string,
  closedAmount?: number
): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized — only admins can update deal stage");
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { partner: true, borrower: true },
  });
  if (!deal) throw new Error("Deal not found");

  const allowed = STAGE_TRANSITIONS[deal.stage];
  if (!allowed?.includes(newStage)) {
    throw new Error(`Cannot move from ${deal.stage} to ${newStage}`);
  }

  const stageEnum = newStage as DealStage;
  const updateData: {
    stage: DealStage;
    stageChangedAt: Date;
    declineReason?: string;
    lostReason?: string;
    loanAmountClosed?: number;
  } = {
    stage: stageEnum,
    stageChangedAt: new Date(),
  };
  if (newStage === "DECLINED" && reason != null) updateData.declineReason = reason;
  if (newStage === "LOST" && reason != null) updateData.lostReason = reason;
  if (newStage === "CLOSED" && closedAmount != null) updateData.loanAmountClosed = closedAmount;

  await prisma.deal.update({
    where: { id: dealId },
    data: updateData,
  });

  const actorId = await resolveActorId(session.user);
  await prisma.dealEvent.create({
    data: {
      dealId,
      actorId: actorId ?? undefined,
      eventType: DealEventType.STAGE_CHANGE,
      fromStage: deal.stage,
      toStage: stageEnum,
      note: reason ?? undefined,
      visibility: EventVisibility.INTERNAL,
    },
  });

  if (newStage === "CLOSED" && closedAmount != null) {
    const commission = await prisma.commission.findUnique({
      where: { dealId },
      select: { id: true, partnerPct: true },
    });
    if (commission) {
      const grossCommission = closedAmount * BROKER_GROSS_COMMISSION_RATE;
      const partnerAmount = grossCommission * commission.partnerPct;
      await prisma.commission.update({
        where: { id: commission.id },
        data: {
          status: CommissionStatus.CONFIRMED,
          grossCommission,
          partnerAmount,
          closedLoanAmount: closedAmount,
        },
      });
    }
  }

  const stageInfo = getStageInfo(newStage);
  notifyPartner(
    deal.partner.email,
    `Deal ${deal.referenceNumber} — ${stageInfo.label}`,
    deal.referenceNumber,
    `This deal has been moved to ${stageInfo.label}.`,
    dealId
  ).catch(() => {});

  if (deal.enableClientTracking && deal.borrower?.email?.trim()) {
    const baseUrl = getBaseUrlForEmail();
    const trackingUrl = `${baseUrl}/status/${deal.borrowerAccessToken}`;
    notifyBorrower(
      deal.borrower.email.trim(),
      deal.borrower.firstName,
      `Your loan application — ${stageInfo.label}`,
      `Your application (${deal.referenceNumber}) has been updated to: ${stageInfo.label}. You can track progress using the link below.`,
      trackingUrl
    ).catch(() => {});
  }

  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath(`/partner/deals/${dealId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/partner/dashboard");
}

export async function assignLender(dealId: string, lenderId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized — only admins can assign lenders");
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { partner: true, assignedLender: true, borrower: true },
  });
  if (!deal) throw new Error("Deal not found");

  const lender = await prisma.lender.findUnique({ where: { id: lenderId } });
  if (!lender) throw new Error("Lender not found");

  await prisma.deal.update({
    where: { id: dealId },
    data: { assignedLenderId: lenderId },
  });

  await prisma.dealLender.upsert({
    where: { dealId_lenderId: { dealId, lenderId } },
    create: { dealId, lenderId, status: DealLenderStatus.ASSIGNED },
    update: { status: DealLenderStatus.ASSIGNED },
  });

  const actorId = await resolveActorId(session.user);
  await prisma.dealEvent.create({
    data: {
      dealId,
      actorId: actorId ?? undefined,
      eventType: DealEventType.LENDER_ASSIGNED,
      note: lender.name,
      visibility: EventVisibility.INTERNAL,
      metadata: { lenderId, lenderName: lender.name },
    },
  });

  notifyPartner(
    deal.partner.email,
    `Lender assigned — ${deal.referenceNumber}`,
    deal.referenceNumber,
    `${lender.name} has been assigned to your deal.`,
    dealId
  ).catch(() => {});

  if (deal.enableClientTracking && deal.borrower?.email?.trim()) {
    const baseUrl = getBaseUrlForEmail();
    const trackingUrl = `${baseUrl}/status/${deal.borrowerAccessToken}`;
    notifyBorrower(
      deal.borrower.email.trim(),
      deal.borrower.firstName,
      `Lender assigned to your application — ${deal.referenceNumber}`,
      `A lender (${lender.name}) has been assigned to your application. You can track progress using the link below.`,
      trackingUrl
    ).catch(() => {});
  }

  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath(`/partner/deals/${dealId}`);
}

export async function addDealNote(
  dealId: string,
  note: string,
  visibility: "INTERNAL" | "PARTNER" | "BORROWER"
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const visibilityEnum =
    visibility === "INTERNAL"
      ? EventVisibility.INTERNAL
      : visibility === "PARTNER"
        ? EventVisibility.PARTNER
        : EventVisibility.BORROWER;

  const actorId = await resolveActorId(session.user);

  await prisma.dealEvent.create({
    data: {
      dealId,
      actorId: actorId ?? undefined,
      eventType: DealEventType.NOTE,
      note,
      visibility: visibilityEnum,
    },
  });

  revalidatePath(`/admin/deals/${dealId}`);
  revalidatePath(`/partner/deals/${dealId}`);
}

export async function markCommissionPaid(commissionId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized — only admins can mark commission paid");
  }

  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: CommissionStatus.PAID, paidAt: new Date() },
  });

  revalidatePath("/admin/commissions");
  revalidatePath("/partner/commissions");
}

export async function sendTrackingEmail(
  dealId: string,
  recipientEmail: string,
  recipientName: string
): Promise<{ success: boolean; error?: string; trackingUrl: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { partner: { include: { users: true } } },
  });

  if (!deal) throw new Error("Deal not found");

  const baseUrl = getBaseUrlForEmail();
  const trackingUrl = `${baseUrl}/status/${deal.borrowerAccessToken}`;

  const subject = `Your loan application — ${deal.referenceNumber}`;
  const textBody = `Hi ${recipientName},\n\nYour loan application has been submitted. Track your progress here:\n\n${trackingUrl}\n\nReference: ${deal.referenceNumber}\n\n— ${session.user.name}\nLoanFlow`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Your loan application</h2>
      <p style="margin-bottom: 12px;">Hi ${recipientName},</p>
      <p style="margin-bottom: 24px;">Your loan application has been submitted. You can track its progress using the link below.</p>
      <p style="margin-bottom: 24px;">
        <a href="${trackingUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">Track your application</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Or copy this link: ${trackingUrl}</p>
      <p style="color: #6b7280; font-size: 14px;">Reference: ${deal.referenceNumber}</p>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">— ${session.user.name}<br>LoanFlow</p>
    </div>
  `;

  const emailOpts: SendEmailOptions = {
    to: recipientEmail,
    subject,
    html: htmlBody,
    text: textBody,
  };
  const result = await sendEmail(emailOpts);

  if (!result.ok) {
    return { success: false, error: result.error, trackingUrl };
  }

  return { success: true, trackingUrl };
}
