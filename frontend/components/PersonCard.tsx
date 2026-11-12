import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export default function PersonCard({
  name,
  designation,
  affiliation,
  country,
  photoUrl,
  bio,
  tags,
  linkedinUrl,
}: {
  name: string;
  designation?: string;
  affiliation?: string;
  country?: string;
  photoUrl: string;
  bio?: string;
  tags?: string[];
  linkedinUrl?: string;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
      }}
      elevation={1}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar src={photoUrl} alt={name} sx={{ width: 64, height: 64 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {name}
            </Typography>
            {designation && (
              <Typography variant="body2" color="text.secondary">
                {designation}
              </Typography>
            )}
          </Box>
          {linkedinUrl && (
            <IconButton
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label={`${name} on LinkedIn`}
              sx={{ color: "#0a66c2" }}
            >
              <LinkedInIcon />
            </IconButton>
          )}
        </Stack>
        {(affiliation || country) && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {[affiliation, country].filter(Boolean).join(", ")}
          </Typography>
        )}
        {bio && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {bio}
          </Typography>
        )}
        {tags && tags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
