import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PageHero from "@/components/PageHero";

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
      <PageHero title={title} />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 4 }}>
          Last updated: {lastUpdated}
        </Typography>
        {sections.map((section) => (
          <div key={section.heading}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
              {section.heading}
            </Typography>
            {section.body.map((para, i) => (
              <Typography key={i} variant="body1" color="text.secondary" paragraph>
                {para}
              </Typography>
            ))}
          </div>
        ))}
      </Container>
    </>
  );
}
