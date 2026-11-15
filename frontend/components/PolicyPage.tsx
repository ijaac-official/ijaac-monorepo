import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PageHero from "@/components/PageHero";
import ProseText from "@/components/ProseText";

export interface PolicySection {
  heading: string;
  body: string[];
}

export default function PolicyPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <PageHero title={title} icon="policy" />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 4 }}>
          Last updated: {lastUpdated}
        </Typography>
        {sections.map((section) => (
          <div key={section.heading}>
            <Typography variant="h6" component="h2" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
              {section.heading}
            </Typography>
            <ProseText text={section.body} color="text.secondary" sx={{ mb: 2 }} />
          </div>
        ))}
      </Container>
    </>
  );
}
