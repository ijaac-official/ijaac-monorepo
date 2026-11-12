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
  correspondingPhone: z.string().optional(),
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
  affiliation: z.string().optional(),
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

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().optional(),
});

export const totpVerifySchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
