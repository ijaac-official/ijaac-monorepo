# IJAAC Journal Platform

Two Next.js 14 apps + shared packages, no database engine - all structured data
("the DB") lives as JSON files in S3 (see `packages/data-store`), and
manuscript files live in the same S3 bucket under a different prefix.

```
frontend/          Public journal site (Next.js App Router + MUI)
admin/              Admin dashboard (Next.js App Router + MUI + NextAuth)
packages/
  shared/           Types + zod validation schemas, used by both apps
  aws/              S3 client: object read/write, ETag-based optimistic
                     locking, presigned URLs, public asset URLs
  data-store/       "Database": one JSON array per collection in S3
                     (submissions, books, reviewers, editorial-board,
                     issues, admin-users, contact-messages)
  email/            Nodemailer (Gmail) transporter + HTML templates
```

## 1. Prerequisites

- Node.js 18.18+ (20 LTS recommended)
- pnpm (`corepack enable` or `npm i -g pnpm`)
- An AWS account with an S3 bucket
- A Gmail account with 2-Step Verification enabled (for sending mail)

## 2. Install

```bash
pnpm install
```

## 3. Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env
```

Next.js only reads env files from inside each app's own folder, so copy (or
symlink) the same file into both apps:

```bash
cp .env frontend/.env.local
cp .env admin/.env.local
```

### AWS S3 setup

1. Create a bucket (any region close to your users, e.g. `ap-south-1`).
2. Create an IAM user (or role) with a policy allowing `s3:GetObject`,
   `s3:PutObject`, `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/*`, and put
   its access key / secret into `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
3. Keep "Block all public access" ON for ACLs, but add this **bucket policy**
   so only the `public/` prefix (book covers, reviewer/editor photos) is
   readable by anyone - manuscripts and the JSON "database" under `data/`
   and `submissions/` stay private:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadForPublicPrefix",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR_BUCKET/public/*"
       }
     ]
   }
   ```

   (For this specific policy to apply, also turn off "Block public access to
   buckets and objects granted through new public bucket or access point
   policies" in the bucket's Block Public Access settings - the other three
   checkboxes can stay on.)

### Gmail App Password (nodemailer)

Gmail will not accept your normal account password for SMTP. You need an
**App Password**:

1. Turn on 2-Step Verification on the Google account you want to send from:
   https://myaccount.google.com/signinoptions/two-step-verification
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password (name it e.g. "IJAAC Journal"), select app "Mail".
4. Google shows a 16-character code - copy it (no spaces) into
   `GMAIL_APP_PASSWORD`. Put the Gmail address itself into `GMAIL_USER`.

If you don't see the "App passwords" page, 2-Step Verification isn't fully
enabled yet on that account - Google hides the page until it is.

## 4. Seed dummy data

Creates a default admin user + sample issues, reviewers, editorial board,
and books (placeholder images via placehold.co):

```bash
pnpm db:seed
```

This prints the generated admin email/password - **change it** (there's no
"forgot password" flow yet; update `admin-users.json` in S3 directly or add
a new admin user and deactivate the seeded one).

## 5. Run

```bash
pnpm dev:frontend   # http://localhost:3000
pnpm dev:admin      # http://localhost:3001
```

## Submission → review → publish flow

1. Author submits a paper on the frontend (`/submit-paper`) - file goes to
   S3 under `submissions/manuscripts/`, metadata is appended to
   `data/submissions.json`, and the author + editor both get an email.
2. Editor reviews it in the admin dashboard (`/submissions/:id`), can view
   the file via a short-lived presigned URL, and marks it Under Review /
   Approved / Rejected (with an optional comment). Approve/Reject triggers
   an email to the corresponding author.
3. Once Approved, the editor assigns it to an Issue and clicks Publish - it
   then shows up on the public Current Issue / Archives pages.

## Phase 2 (not yet implemented)

- Payment gateway for India (low-fee, high-security) - candidates to
  evaluate: Razorpay, Cashfree, or UPI AutoPay via an aggregator. Needs a
  decision on what's actually being charged for (processing fee? book
  purchases? open-access fee?) before wiring this in.
