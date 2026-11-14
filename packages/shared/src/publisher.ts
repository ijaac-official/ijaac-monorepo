/**
 * Publisher imprint - required by ISSN (India) to be displayed on the
 * website and on the serial itself (name of publisher + complete postal
 * address + place of publication). Single source of truth for the site
 * footer, Contact page, typeset PDFs and metadata.
 */
export const PUBLISHER = {
  name: "Vijay K Malviya",
  type: "Individual",
  street: "M 119, Silicon City",
  city: "Indore",
  state: "Madhya Pradesh",
  /** 6-digit PIN code */
  pin: "452013",
  country: "India",
  placeOfPublication: "Indore, Madhya Pradesh, India",
  email: "ijaac.official@gmail.com",
} as const;

/** "M 119, Silicon City, Indore, Madhya Pradesh 452xxx, India" (PIN omitted while blank). */
export function publisherAddress(): string {
  const cityLine = [PUBLISHER.city, [PUBLISHER.state, PUBLISHER.pin].filter(Boolean).join(" ")].join(", ");
  return [PUBLISHER.street, cityLine, PUBLISHER.country].join(", ");
}
