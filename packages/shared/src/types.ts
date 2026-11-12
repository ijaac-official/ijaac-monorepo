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
    currency: string;
    paidAt: string;
  };
  /** Set when the submission fee was waived via an early-bird coupon */
  couponCode?: string;

  submittedAt: string;
  updatedAt: string;
}

export type AdminRole = "SUPER_ADMIN" | "EDITOR";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  /** TOTP secret (base32) - set once the owner completes 2FA setup */
  totpSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  volume: string;
  number: string;
  year: number;
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
  createdAt: string;
  updatedAt: string;
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
  affiliation?: string;
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

export interface PlatformSettings {
  earlyBirdEnabled: boolean;
  earlyBirdCouponCode: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  earlyBirdEnabled: false,
  earlyBirdCouponCode: "EARLYBIRD",
};

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}
