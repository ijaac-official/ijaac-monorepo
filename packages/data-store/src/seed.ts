import path from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  // Imported after dotenv.config() so @ijaac/aws reads populated env vars.
  const { createAdminUser, listAdminUsers } = await import("./collections/admin-users");
  const { createIssue, listIssues } = await import("./collections/issues");
  const { createBook, listBooks } = await import("./collections/books");
  const { createReviewer, listReviewers } = await import("./collections/reviewers");
  const { createEditorialBoardMember, listEditorialBoard } = await import(
    "./collections/editorial-board"
  );

  console.log("Seeding dummy data into S3 JSON store...\n");

  // --- Admin user --------------------------------------------------------
  const existingAdmins = await listAdminUsers();
  if (existingAdmins.length === 0) {
    const email = process.env.ADMIN_SEED_EMAIL ?? "admin@ijaac.org";
    const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";
    const passwordHash = await bcrypt.hash(password, 12);
    await createAdminUser({
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    });
    console.log(`Created admin user ${email} / password: ${password} (CHANGE THIS)`);
  } else {
    console.log("Admin users already exist, skipping.");
  }

  // --- Issues --------------------------------------------------------------
  if ((await listIssues()).length === 0) {
    await createIssue({
      volume: "5",
      number: "2",
      year: 2026,
      title: "Vol. 5, Issue 2 (Mar-Apr 2026)",
      publishDate: new Date("2026-03-01").toISOString(),
      isCurrent: true,
    });
    await createIssue({
      volume: "5",
      number: "1",
      year: 2026,
      title: "Vol. 5, Issue 1 (Jan-Feb 2026)",
      publishDate: new Date("2026-01-01").toISOString(),
    });
    await createIssue({
      volume: "4",
      number: "6",
      year: 2025,
      title: "Vol. 4, Issue 6 (Nov-Dec 2025)",
      publishDate: new Date("2025-11-01").toISOString(),
    });
    console.log("Seeded issues.");
  } else {
    console.log("Issues already exist, skipping.");
  }

  // --- Reviewers -----------------------------------------------------------
  const PORTRAIT = (path: string) => `https://randomuser.me/api/portraits/${path}.jpg`;

  if ((await listReviewers()).length === 0) {
    const reviewers = [
      { name: "Dr. Ananya Rao", designation: "Professor", affiliation: "IIT Madras", country: "India", photo: PORTRAIT("women/44") },
      { name: "Dr. Michael Chen", designation: "Associate Professor", affiliation: "NUS Singapore", country: "Singapore", photo: PORTRAIT("men/32") },
      { name: "Dr. Sofia Martinez", designation: "Senior Researcher", affiliation: "UPC Barcelona", country: "Spain", photo: PORTRAIT("women/68") },
      { name: "Dr. Rajesh Kumar", designation: "Professor", affiliation: "IISc Bangalore", country: "India", photo: PORTRAIT("men/51") },
      { name: "Dr. Emily Johnson", designation: "Assistant Professor", affiliation: "University of Toronto", country: "Canada", photo: PORTRAIT("women/21") },
      { name: "Dr. Hiroshi Tanaka", designation: "Professor", affiliation: "University of Tokyo", country: "Japan", photo: PORTRAIT("men/76") },
    ];
    for (const [i, r] of reviewers.entries()) {
      await createReviewer({
        name: r.name,
        designation: r.designation,
        affiliation: r.affiliation,
        country: r.country,
        photoUrl: r.photo,
        bio: `${r.name} has over a decade of experience reviewing peer-reviewed research in applied computing and machine learning.`,
        email: `reviewer${i + 1}@example.com`,
        linkedinUrl: "https://www.linkedin.com/",
        areasOfInterest: ["Machine Learning", "Data Science", "AI Ethics"],
        displayOrder: i,
      });
    }
    console.log("Seeded reviewers.");
  } else {
    console.log("Reviewers already exist, skipping.");
  }

  // --- Editorial board -------------------------------------------------------
  if ((await listEditorialBoard()).length === 0) {
    await createEditorialBoardMember({
      name: "Dr. Priya Sharma",
      designation: "Editor-in-Chief",
      affiliation: "National Institute of Technology",
      country: "India",
      photoUrl: PORTRAIT("women/12"),
      bio: "Dr. Sharma leads the editorial vision of the journal with 20+ years in AI research.",
      email: "editor-in-chief@ijaac.org",
      linkedinUrl: "https://www.linkedin.com/",
      role: "EDITOR_IN_CHIEF",
      displayOrder: 0,
    });
    const associates: [string, string][] = [
      ["Dr. David Lee", PORTRAIT("men/15")],
      ["Dr. Fatima Al-Sayed", PORTRAIT("women/55")],
    ];
    for (const [i, [name, photo]] of associates.entries()) {
      await createEditorialBoardMember({
        name,
        designation: "Associate Editor",
        affiliation: "International Research University",
        country: "-",
        photoUrl: photo,
        linkedinUrl: "https://www.linkedin.com/",
        role: "ASSOCIATE_EDITOR",
        displayOrder: i + 1,
      });
    }
    const members: [string, string][] = [
      ["Dr. Wei Zhang", PORTRAIT("men/8")],
      ["Dr. Carlos Oliveira", PORTRAIT("men/22")],
      ["Dr. Nina Petrova", PORTRAIT("women/33")],
    ];
    for (const [i, [name, photo]] of members.entries()) {
      await createEditorialBoardMember({
        name,
        designation: "Editorial Board Member",
        affiliation: "International Research University",
        country: "-",
        photoUrl: photo,
        linkedinUrl: "https://www.linkedin.com/",
        role: "MEMBER",
        displayOrder: i + 3,
      });
    }
    console.log("Seeded editorial board.");
  } else {
    console.log("Editorial board already exists, skipping.");
  }

  // --- Books -----------------------------------------------------------------
  if ((await listBooks()).length === 0) {
    const books = [
      {
        title: "Foundations of Applied Machine Learning",
        authors: ["Dr. Ananya Rao", "Dr. Rajesh Kumar"],
        description:
          "A comprehensive guide to machine learning fundamentals with real-world case studies for researchers and practitioners.",
        category: "Machine Learning",
        publishedYear: 2024,
      },
      {
        title: "Data Science for Social Good",
        authors: ["Dr. Emily Johnson"],
        description:
          "Explores how data science methodologies can be applied to solve pressing societal challenges.",
        category: "Data Science",
        publishedYear: 2023,
      },
      {
        title: "Advanced Cloud Architecture & Computing",
        authors: ["Dr. Michael Chen", "Dr. Sofia Martinez"],
        description:
          "A deep dive into scalable, secure cloud-native system design for modern enterprises.",
        category: "Cloud Computing",
        publishedYear: 2025,
      },
      {
        title: "Ethics in Artificial Intelligence",
        authors: ["Dr. Hiroshi Tanaka"],
        description:
          "Examines the ethical frameworks necessary to guide responsible AI development and deployment.",
        category: "AI Ethics",
        publishedYear: 2024,
      },
    ];
    const COVERS = [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
      "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&q=80",
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
    ];
    for (const [i, b] of books.entries()) {
      await createBook({
        ...b,
        coverImageUrl: COVERS[i % COVERS.length],
        purchaseLink: "https://www.amazon.in/",
        publisher: "IJAAC Press",
        isbn: `978-0-00000-${100 + i}-0`,
        featured: i === 0,
      });
    }
    console.log("Seeded books.");
  } else {
    console.log("Books already exist, skipping.");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
