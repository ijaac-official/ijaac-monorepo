import Container from "@mui/material/Container";
import PageHero from "@/components/PageHero";
import SubmissionForm from "@/components/SubmissionForm";

export const metadata = { title: "Submit Paper - IJAAC Journal" };

export default function SubmitPaperPage() {
  return (
    <>
      <PageHero
        title="Submit Your Manuscript"
        subtitle="Please complete all fields accurately. See our Author Guidelines before submitting."
        image="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <SubmissionForm />
      </Container>
    </>
  );
}
