import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { S3_PREFIXES, copyObject, publicUrl } from "@ijaac/aws";
import { createBook, deleteBook, getBookSubmission, updateBookSubmission } from "@ijaac/data-store";
import { sendBookSubmissionDecisionEmail } from "@ijaac/email";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

const schema = z.object({
  purchaseLink: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  notify: z.boolean().optional(),
});

class PublishConflict extends Error {}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * ACCEPTED -> PUBLISHED: creates a Book record (title, authors, synopsis, cover copied
 * to the public/ prefix) with a placeholder purchase link the editor can change later
 * on the Books page, and links it via publishedBookId.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const sub = await getBookSubmission(params.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status !== "ACCEPTED" || sub.publishedBookId) {
    return NextResponse.json({ error: "Only accepted, unpublished submissions can be published" }, { status: 409 });
  }

  let coverImageUrl = `${frontendUrl()}/logo.png`;
  if (sub.coverKey) {
    const name = sub.coverKey.split("/").pop() ?? "cover";
    const publicKey = `${S3_PREFIXES.publicAssets}books/${randomUUID()}-${name}`;
    try {
      await copyObject(sub.coverKey, publicKey);
      coverImageUrl = publicUrl(publicKey);
    } catch (err) {
      console.error("Cover copy failed", err);
      return NextResponse.json({ error: "Could not publish the cover image, please try again" }, { status: 502 });
    }
  }

  const book = await createBook({
    title: sub.subtitle ? `${sub.title}: ${sub.subtitle}` : sub.title,
    authors: [sub.authorName, ...(sub.coAuthors ?? [])],
    description: sub.synopsis,
    coverImageUrl,
    purchaseLink: parsed.data.purchaseLink || `${frontendUrl()}/books`,
    publisher: "IJAAC",
    publishedYear: new Date().getFullYear(),
    category: sub.category,
  });

  let updated;
  try {
    updated = await updateBookSubmission(sub.id, (current) => {
      if (current.status !== "ACCEPTED" || current.publishedBookId) throw new PublishConflict();
      return {
        status: "PUBLISHED",
        publishedBookId: book.id,
        decidedById: (session.user as { id?: string }).id ?? session.user?.email ?? undefined,
        decidedAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    // Lost a race with another publish (or the record changed): undo our Book.
    await deleteBook(book.id).catch((e) => console.error("Could not roll back book", e));
    if (err instanceof PublishConflict) {
      return NextResponse.json({ error: "This submission was already published or changed" }, { status: 409 });
    }
    throw err;
  }

  let emailed = false;
  if (parsed.data.notify !== false) {
    try {
      await sendBookSubmissionDecisionEmail(updated, "PUBLISHED");
      emailed = true;
    } catch (err) {
      console.error("Book published email failed", err);
    }
  }
  return NextResponse.json({ submission: updated, book, emailed });
}
