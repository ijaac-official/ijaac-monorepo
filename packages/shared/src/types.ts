// ---------------------------------------------------------------------------
// Core domain types. These describe the shape of records stored as JSON
// arrays in S3 (see @ijaac/data-store). There is no database engine -
// each "collection" below is one JSON file: data/<collection>.json
// ---------------------------------------------------------------------------

export type SubmissionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
];

export interface SubmissionAuthor {
  name: string;
  email: string;
  affiliation?: string;
  isCorresponding?: boolean;
}

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: SubmissionAuthor[];
  correspondingEmail: string;
  correspondingPhone?: string;

  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;

  status: SubmissionStatus;
  reviewComment?: string;

  volume?: string;
  issueNumber?: string;
  issueId?: string;

  publishedFileKey?: string;
  /** Public S3 key for the final version, set when published - used for Google Scholar indexing */
  publicFileKey?: string;
  publishedAt?: string;
  /** Sequential internal identifier assigned at publish time, e.g. "e008" - not a DOI */
  articleNumber?: string;

  decidedById?: string;
  decidedAt?: string;

  /** Razorpay checkout fee paid at submission time - absent if waived via coupon */
  payment?: {
    orderId: string;
    paymentId: string;
    amountInPaise: number;
    baseAmountInPaise?: number;
    currency: string;
    paidAt: string;
    receiptNumber?: string;
  };
  /** Coupon applied at checkout, if any */
  couponCode?: string;
  discountPercent?: number;

  /** Public/private visibility of a published paper. Undefined means public. */
  isPublic?: boolean;
  /** "ADMIN" for papers entered directly by an editor (no checkout) */
  source?: "AUTHOR" | "ADMIN";
  /** Set once the certificate(s) + final paper have been emailed to every author */
  certificatesSentAt?: string;
  /** Peer-review assignments to approved reviewers */
  reviewAssignments?: ReviewAssignment[];

  submittedAt: string;
  updatedAt: string;
}

export type ReviewAssignmentStatus = "ASSIGNED" | "COMPLETED" | "DECLINED";

export interface ReviewAssignment {
  reviewerId: string;
  assignedAt: string;
  status: ReviewAssignmentStatus;
  completedAt?: string;
  /** Editor's note of the reviewer's recommendation, e.g. "Accept with minor revisions" */
  recommendation?: string;
}

/** True if a submission should be visible on the public site. */
export function isPubliclyVisible(s: Pick<Submission, "status" | "isPublic">): boolean {
  return s.status === "PUBLISHED" && s.isPublic !== false;
}

export type AdminRole = "SUPER_ADMIN" | "EDITOR";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  /** Pending email login code - HMAC of the code, never the code itself */
  loginOtp?: {
    hash: string;
    expiresAt: string;
    sentAt: string;
    attempts: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Issues are monthly: one volume per year (Volume 1 = first year), 12 issues
 * per volume, issue number = month (1-12).
 */
export interface Issue {
  id: string;
  volume: string;
  number: string;
  year: number;
  /** 1-12 */
  month?: number;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  publishDate?: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  coverImageUrl: string;
  purchaseLink: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  category?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reviewer {
  id: string;
  name: string;
  designation?: string;
  affiliation?: string;
  country?: string;
  photoUrl: string;
  bio?: string;
  email?: string;
  linkedinUrl?: string;
  areasOfInterest: string[];
  displayOrder: number;
  isActive: boolean;
  /**
   * Registration state. Reviewers who apply via the public "Become a Reviewer"
   * form start as PENDING. Undefined (legacy, admin-created) means APPROVED.
   */
  status?: ReviewerStatus;
  phone?: string;
  orcid?: string;
  /** Highest qualification, e.g. "PhD in Computer Science" */
  qualification?: string;
  experienceYears?: number;
  /** Optional note from the applicant to the editors */
  motivation?: string;
  appliedAt?: string;
  approvedAt?: string;
  /** Set when the reviewer profile was created by promoting an editorial board member */
  sourceBoardMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewerStatus = "PENDING" | "APPROVED" | "REJECTED";

export function isApprovedReviewer(r: Pick<Reviewer, "status">): boolean {
  return r.status === undefined || r.status === "APPROVED";
}

export type BoardRole =
  | "EDITOR_IN_CHIEF"
  | "ASSOCIATE_EDITOR"
  | "MEMBER"
  | "ADVISORY_BOARD";

export interface EditorialBoardMember {
  id: string;
  name: string;
  designation?: string;
  /** Department, e.g. "Department of Computer Science and Engineering" */
  department?: string;
  affiliation?: string;
  /** Highest qualification, e.g. "Doctor of Engineering (Ph.D.)" */
  qualification?: string;
  /** University that awarded the qualification, e.g. "Lamar University, USA" */
  qualificationInstitution?: string;
  /** Area of specialization, e.g. "Brain-Computer Interface" */
  specialization?: string;
  /** Full postal address (required for new and edited entries) */
  address?: string;
  country?: string;
  photoUrl: string;
  bio?: string;
  email?: string;
  linkedinUrl?: string;
  role: BoardRole;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  /** 1-100; 100 means the submission is free and checkout is skipped entirely */
  discountPercent: number;
  /** Total number of submissions this coupon can be applied to */
  maxRedemptions: number;
  redeemedCount: number;
  /** Manual kill switch - "stop immediately" even if redemptions remain */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}

/** Singleton at data/site-stats.json */
export interface SiteStats {
  visits: number;
  updatedAt: string;
}

export type PaymentRequestKind = "LINK" | "QR";
export type PaymentRequestStatus = "CREATED" | "PAID" | "EXPIRED" | "CANCELLED";

/** A custom Razorpay payment request (Payment Link or UPI QR) raised from the admin. */
export interface PaymentRequest {
  id: string;
  kind: PaymentRequestKind;
  /** plink_... for Payment Links, qr_... for UPI QR codes */
  razorpayId: string;
  amountInPaise: number;
  description: string;
  customer: { name?: string; email?: string; phone?: string };
  submissionId?: string;
  /** Payment Link short URL (LINK only) */
  shortUrl?: string;
  /** Razorpay-hosted QR image (QR only) */
  qrImageUrl?: string;
  status: PaymentRequestStatus;
  paidAt?: string;
  paymentIds?: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// ---------------------------------------------------------------------------
// Fees & charges (admin-managed) and book publication submissions
// ---------------------------------------------------------------------------

/** What a checkout / coupon is for. */
export type ChargeKind = "PAPER" | "BOOK";

/** Coupon scope. Undefined on a Coupon means "ALL" (legacy coupons). */
export type CouponScope = "PAPER" | "BOOK" | "ALL";

// Declaration merge - adds the optional scope to the Coupon interface above.
export interface Coupon {
  /** Which checkout this coupon may be used for. Undefined = ALL. */
  appliesTo?: CouponScope;
}

/** True if a coupon with this scope can be used for the given charge kind. */
export function couponAppliesTo(scope: CouponScope | undefined, kind: ChargeKind): boolean {
  return !scope || scope === "ALL" || scope === kind;
}

/** Singleton at data/settings.json */
export interface JournalSettings {
  paperFeeInPaise: number;
  bookFeeInPaise: number;
  currency: "INR";
  updatedAt: string;
  updatedById?: string;
}

export type BookSubmissionStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "PUBLISHED";

export const BOOK_SUBMISSION_STATUSES: BookSubmissionStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "PUBLISHED",
];

export interface BookSubmission {
  id: string;
  title: string;
  subtitle?: string;
  authorName: string;
  coAuthors?: string[];
  email: string;
  phone: string;
  affiliation?: string;
  category?: string;
  synopsis: string;
  pageCount?: number;
  /**
   * Legacy only: early book requests uploaded a manuscript file. New requests do not -
   * the editorial office collects the manuscript from the author by email.
   */
  manuscriptKey?: string;
  manuscriptName?: string;
  manuscriptType?: string;
  manuscriptSize?: number;
  coverKey?: string;
  coverType?: string;
  status: BookSubmissionStatus;
  reviewComment?: string;
  payment?: {
    orderId: string;
    paymentId: string;
    amountInPaise: number;
    baseAmountInPaise?: number;
    currency: string;
    paidAt: string;
    receiptNumber?: string;
  };
  couponCode?: string;
  discountPercent?: number;
  /** Book record created by "Publish to Books page" */
  publishedBookId?: string;
  decidedById?: string;
  decidedAt?: string;
  submittedAt: string;
  updatedAt: string;
}
