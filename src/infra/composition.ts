/**
 * Composition root — the only file that knows about both ports and concrete
 * adapters. Server actions, route handlers, and Auth.js config import
 * services from here.
 *
 * All singletons are stateless or carry only request-scoped state, so they
 * are safe to share across serverless invocations.
 */
import { AuthService, systemClock } from "@/services/auth/AuthService";
import { ApplicationService } from "@/services/application/ApplicationService";
import { DocumentService } from "@/services/document/DocumentService";
import { BookingService } from "@/services/booking/BookingService";
import { PaymentService } from "@/services/payment/PaymentService";
import { ConsultationService } from "@/services/consultation/ConsultationService";
import { LeadService } from "@/services/lead/LeadService";
import { RecruiterService } from "@/services/recruiter/RecruiterService";
import { PartnerService } from "@/services/partner/PartnerService";
import { DestinationService } from "@/services/catalog/DestinationService";
import { createProgramSearchService } from "@/services/catalog/ProgramSearchService";
import { createTourPackageService } from "@/services/catalog/TourPackageService";
import { BlogService } from "@/services/cms/BlogService";
import { MarketingPageService } from "@/services/cms/MarketingPageService";
import { StatisticService } from "@/services/cms/StatisticService";
import { NotificationService } from "@/services/notification/NotificationService";
import { ConsentService } from "@/services/consent/ConsentService";

import { BcryptHasher } from "./auth/BcryptHasher";
import { PrismaTokenStore } from "./auth/PrismaTokenStore";
import { PrismaUserRepository } from "./db/prisma/PrismaUserRepository";
import { PrismaNotificationRepository } from "./db/prisma/PrismaNotificationRepository";
import { PrismaDestinationRepository } from "./db/prisma/PrismaDestinationRepository";
import { PrismaProgramRepository } from "./db/prisma/PrismaProgramRepository";
import { PrismaTourPackageRepository } from "./db/prisma/PrismaTourPackageRepository";
import { PrismaApplicationRepository } from "./db/prisma/PrismaApplicationRepository";
import { PrismaDocumentRepository } from "./db/prisma/PrismaDocumentRepository";
import { PrismaBookingRepository } from "./db/prisma/PrismaBookingRepository";
import { PrismaPaymentRepository } from "./db/prisma/PrismaPaymentRepository";
import { PrismaConsultationRepository } from "./db/prisma/PrismaConsultationRepository";
import { PrismaLeadRepository } from "./db/prisma/PrismaLeadRepository";
import { PrismaPartnerRepository } from "./db/prisma/PrismaPartnerRepository";
import { PrismaRecruiterRepository } from "./db/prisma/PrismaRecruiterRepository";
import {
  PrismaBlogArticleRepository,
  PrismaMarketingPageRepository,
  PrismaStatisticRepository,
} from "./db/prisma/PrismaContentRepositories";
import { PrismaCookieConsentRepository } from "./db/prisma/PrismaCookieConsentRepository";

import { ResendMailer } from "./email/ResendMailer";
import { VercelBlobObjectStore } from "./storage/VercelBlobObjectStore";
import { FlutterwaveGateway } from "./flutterwave/FlutterwaveGateway";

// ---------------------------------------------------------------------------
// Repository singletons
// ---------------------------------------------------------------------------

export const userRepo = new PrismaUserRepository();
export const notificationRepo = new PrismaNotificationRepository();
export const destinationRepo = new PrismaDestinationRepository();
export const programRepo = new PrismaProgramRepository();
export const tourPackageRepo = new PrismaTourPackageRepository();
export const applicationRepo = new PrismaApplicationRepository();
export const documentRepo = new PrismaDocumentRepository();
export const bookingRepo = new PrismaBookingRepository();
export const paymentRepo = new PrismaPaymentRepository();
export const consultationRepo = new PrismaConsultationRepository();
export const leadRepo = new PrismaLeadRepository();
export const partnerRepo = new PrismaPartnerRepository();
export const recruiterRepo = new PrismaRecruiterRepository();
export const blogRepo = new PrismaBlogArticleRepository();
export const marketingPageRepo = new PrismaMarketingPageRepository();
export const statisticRepo = new PrismaStatisticRepository();
export const consentRepo = new PrismaCookieConsentRepository();

// ---------------------------------------------------------------------------
// Infrastructure adapters
// ---------------------------------------------------------------------------

export const mailer = new ResendMailer();
export const objectStore = new VercelBlobObjectStore();
export const paymentGateway = new FlutterwaveGateway();

const hasher = new BcryptHasher();
const tokenStore = new PrismaTokenStore();

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const authService = new AuthService({
  userRepo,
  notificationRepo,
  hasher,
  tokenStore,
  clock: systemClock,
});

export const applicationService = new ApplicationService({
  applicationRepo,
  programRepo,
  notificationRepo,
});

export const documentService = new DocumentService({
  documentRepo,
  objectStore,
});

export const bookingService = new BookingService({
  bookingRepo,
  tourPackageRepo,
});

export const paymentService = new PaymentService({
  bookingRepo,
  paymentRepo,
  tourPackageRepo,
  notificationRepo,
  paymentGateway,
  redirectUrl: `${APP_URL}/api/payments/flutterwave/callback`,
});

export const consultationService = new ConsultationService({
  consultationRepo,
  notificationRepo,
});

export const leadService = new LeadService({
  leadRepo,
  notificationRepo,
});

export const recruiterService = new RecruiterService({
  recruiterRepo,
  applicationRepo,
  leadRepo,
  notificationRepo,
});

export const partnerService = new PartnerService({
  partnerRepo,
  programRepo,
  applicationRepo,
  leadRepo,
  notificationRepo,
});

export const destinationService = new DestinationService({
  destinationRepo,
  programRepo,
  tourPackageRepo,
});
export const programSearchService = createProgramSearchService(programRepo);
export const tourPackageService = createTourPackageService(tourPackageRepo, destinationRepo);

export const blogService = new BlogService({ blogRepo });
export const marketingPageService = new MarketingPageService({ pageRepo: marketingPageRepo });
export const statisticService = new StatisticService({ statisticRepo });

export const notificationService = new NotificationService({
  notificationRepo,
  mailer,
  resolveUser: async (id: string) => userRepo.findById(id),
});

export const consentService = new ConsentService({ consentRepo });
