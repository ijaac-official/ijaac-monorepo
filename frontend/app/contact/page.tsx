import Container from "@mui/material/Container";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact - IJAAC Journal" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Questions about submissions, reviews, or publication? Reach out."
        image="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <ContactForm />
      </Container>
    </>
  );
}
