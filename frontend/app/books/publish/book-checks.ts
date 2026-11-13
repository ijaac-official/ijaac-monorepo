// Pure (isomorphic) book-submission input handling shared by the form and API routes.
import { z } from "zod";
import { bookSubmissionFormSchema } from "@ijaac/shared";
import { uploadedFileDescriptorSchema } from "@/app/submit-paper/manuscript-checks";

const trimStr = (v: unknown) => (typeof v === "string" ? v.trim() : v);
const optionalStr = (v: unknown) => {
  const t = trimStr(v);
  return t === "" || t === null ? undefined : t;
};

/** Trims strings, drops empty optionals and blank co-authors, coerces pageCount. */
export function normalizeBookInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  const coAuthors = Array.isArray(r.coAuthors)
    ? r.coAuthors.map(trimStr).filter((x) => !(typeof x === "string" && x.length === 0))
    : r.coAuthors;
  let pageCount: unknown = r.pageCount;
  if (pageCount === "" || pageCount === null || pageCount === undefined) pageCount = undefined;
  else if (typeof pageCount === "string") pageCount = Number(pageCount.trim());
  return {
    title: trimStr(r.title),
    subtitle: optionalStr(r.subtitle),
    authorName: trimStr(r.authorName),
    coAuthors: Array.isArray(coAuthors) && coAuthors.length === 0 ? undefined : coAuthors,
    email: trimStr(r.email),
    phone: trimStr(r.phone),
    affiliation: optionalStr(r.affiliation),
    category: trimStr(r.category),
    synopsis: trimStr(r.synopsis),
    pageCount,
  };
}

/** Metadata sent to create-order (kind BOOK) before checkout. */
export const bookCheckoutPrevalidationSchema = z.object({
  kind: z.literal("BOOK"),
  couponCode: z.string().trim().max(64).optional(),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm the rights declaration and the non-refundable fee policy",
    }),
  }),
  book: bookSubmissionFormSchema,
  cover: uploadedFileDescriptorSchema("Please choose a cover image.").optional(),
});
