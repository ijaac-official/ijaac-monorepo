import { z } from "zod";

export const ACCEPTED_MANUSCRIPT_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export const MAX_MANUSCRIPT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const submissionAuthorSchema = z.object({
  name: z.string().min(2, "Author name is required"),
  email: z.string().email("Valid author email is required"),
  affiliation: z.string().optional(),
  isCorresponding: z.boolean().optional(),
});

/** Mobile number: optional leading +, then 10-15 digits with optional spaces/hyphens */
export const PHONE_REGEX = /^\+?[0-9](?:[\s-]?[0-9]){9,14}$/;

export const submissionFormSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  abstract: z
    .string()
    .min(100, "Abstract must be at least 100 characters")
    .max(5000, "Abstract must be under 5000 characters"),
  keywords: z
    .array(z.string().min(2))
    .min(3, "Please provide at least 3 keywords")
    .max(10, "Please provide at most 10 keywords"),
  authors: z.array(submissionAuthorSchema).min(1, "At least one author is required"),
  correspondingEmail: z.string().email("A valid corresponding author email is required"),
  correspondingPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "A valid mobile number is required (10-15 digits, optional +country code)"),
});

export type SubmissionFormInput = z.infer<typeof submissionFormSchema>;

export const paymentVerificationSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW", "PUBLISHED"]),
  reviewComment: z.string().max(3000).optional(),
  issueId: z.string().optional(),
});

export const bookInputSchema = z.object({
  title: z.string().min(2),
  authors: z.array(z.string().min(2)).min(1),
  description: z.string().min(10),
  coverImageUrl: z.string().url(),
  purchaseLink: z.string().url(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().int().optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
});

export const reviewerInputSchema = z.object({
  name: z.string().min(2),
  designation: z.string().optional(),
  affiliation: z.string().optional(),
  country: z.string().optional(),
  photoUrl: z.string().url(),
  bio: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  areasOfInterest: z.array(z.string()).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const editorialBoardInputSchema = z.object({
  name: z.string().min(2),
  designation: z.string().optional(),
  department: z.string().trim().optional(),
  affiliation: z.string().optional(),
  qualification: z.string().trim().optional(),
  qualificationInstitution: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  address: z.string().trim().min(10, "Full address is required"),
  country: z.string().optional(),
  photoUrl: z.string().url(),
  bio: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  role: z.enum(["EDITOR_IN_CHIEF", "ASSOCIATE_EDITOR", "MEMBER", "ADVISORY_BOARD"]),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10).max(3000),
});

export const otpRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Admin full-edit of a submission - every field optional. */
export const submissionUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  abstract: z.string().min(10).max(10000).optional(),
  keywords: z.array(z.string().min(1)).max(20).optional(),
  authors: z.array(submissionAuthorSchema).min(1).optional(),
  correspondingEmail: z.string().email().optional(),
  correspondingPhone: z.string().optional(),
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"]).optional(),
  reviewComment: z.string().max(3000).optional(),
  issueId: z.string().optional(),
  volume: z.string().optional(),
  issueNumber: z.string().optional(),
  articleNumber: z.string().optional(),
  publishedAt: z.string().optional(),
  isPublic: z.boolean().optional(),
});
export type SubmissionUpdateInput = z.infer<typeof submissionUpdateSchema>;

/** Admin "direct" submission - same fields as the public form, phone optional, looser minimums. */
export const adminSubmissionSchema = submissionFormSchema.extend({
  correspondingPhone: z.string().optional(),
  publishImmediately: z.boolean().optional(),
  issueId: z.string().optional(),
});

export const reviewerApplicationSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().regex(PHONE_REGEX, "A valid mobile number is required"),
  designation: z.string().trim().min(2, "Designation is required"),
  affiliation: z.string().trim().min(2, "Affiliation is required"),
  country: z.string().trim().min(2, "Country is required"),
  qualification: z.string().trim().min(2, "Qualification is required"),
  experienceYears: z.number().int().min(0).max(70).optional(),
  areasOfInterest: z.array(z.string().trim().min(2)).min(1, "Add at least one area of expertise").max(15),
  bio: z.string().trim().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  orcid: z.string().trim().optional(),
  motivation: z.string().trim().max(2000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});
export type ReviewerApplicationInput = z.infer<typeof reviewerApplicationSchema>;

export const couponUpdateSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const paymentRequestCreateSchema = z.object({
  kind: z.enum(["LINK", "QR"]),
  amountInr: z.number().min(1, "Minimum amount is Rs 1").max(500000, "Amount is too large"),
  description: z.string().trim().min(2, "Description is required").max(250),
  customer: z
    .object({
      name: z.string().trim().max(100).optional().or(z.literal("")),
      email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 -]{7,16}$/, "Invalid phone number")
        .optional()
        .or(z.literal("")),
    })
    .default({}),
  submissionId: z.string().trim().optional().or(z.literal("")),
  expiryDays: z.union([z.literal(0), z.literal(1), z.literal(7), z.literal(30)]).default(0),
});
export type PaymentRequestCreateInput = z.infer<typeof paymentRequestCreateSchema>;

// ---------------------------------------------------------------------------
// Fees & charges, coupon scope, book publication submissions
// ---------------------------------------------------------------------------

export const couponScopeSchema = z.enum(["PAPER", "BOOK", "ALL"]);

/** Admin "Fees & Charges" form - whole rupees, minimum Rs 1. */
export const settingsUpdateSchema = z
  .object({
    paperFeeInr: z.number().int("Use whole rupees").min(1, "Minimum fee is Rs 1").max(500000, "Fee is too large"),
    bookFeeInr: z.number().int("Use whole rupees").min(1, "Minimum fee is Rs 1").max(500000, "Fee is too large"),
  })
  .partial()
  .refine((v) => v.paperFeeInr !== undefined || v.bookFeeInr !== undefined, { message: "Nothing to update" });

export const MAX_BOOK_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
/** Largest file that may be sent in a multipart request body when the direct S3 upload fails. */
export const MULTIPART_FALLBACK_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

export const bookSubmissionFormSchema = z.object({
  title: z.string().trim().min(3, "Book title must be at least 3 characters").max(300, "Book title is too long"),
  subtitle: z.string().trim().max(300, "Subtitle is too long").optional(),
  authorName: z.string().trim().min(2, "Author name is required").max(150),
  coAuthors: z
    .array(z.string().trim().min(2, "Each co-author name must be at least 2 characters").max(150))
    .max(20, "At most 20 co-authors")
    .optional(),
  email: z.string().trim().email("A valid email is required"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "A valid mobile number is required (10-15 digits, optional +country code)"),
  affiliation: z.string().trim().max(300).optional(),
  category: z.string().trim().min(2, "Category / subject is required").max(150),
  synopsis: z
    .string()
    .trim()
    .min(100, "Synopsis must be at least 100 characters")
    .max(5000, "Synopsis must be under 5000 characters"),
  pageCount: z.number().int("Page count must be a whole number").min(1).max(10000).optional(),
});
export type BookSubmissionFormInput = z.infer<typeof bookSubmissionFormSchema>;

export const bookSubmissionDecisionSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "ACCEPTED", "REJECTED"]),
  reviewComment: z.string().trim().max(3000).optional(),
  notify: z.boolean().optional(),
});
