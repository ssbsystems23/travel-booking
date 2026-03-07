import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AdminLink from "./AdminLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://srihtt.in"),
  title: {
    default: "Sri Hanumanth Tours and Travels | Taxi Service in Mumbai | Cab Booking Mumbai",
    template: "%s | Sri Hanumant Travels",
  },
  description:
    "Book affordable AC taxi & cab service in Mumbai with Sri Hanumanth Tours and Travels. Local & outstation car rental, airport pickup & drop. Innova Crysta, Ertiga, Swift Dzire. Call 8779300154.",
  keywords: [
    "taxi service in mumbai",
    "cab booking mumbai",
    "car rental mumbai",
    "Sri hanumant travels",
    "Sri hanumanth tours and travels",
    "Sri hanumanth travels",
    "airport taxi mumbai",
    "outstation cab mumbai",
    "local cab mumbai",
    "mira road taxi",
    "mumbai cab service",
    "innova crysta rental mumbai",
    "ertiga rental mumbai",
    "taxi near me",
    "cab near me mumbai",
    "vipassana pagoda taxi",
  ],
  authors: [{ name: "Sri Hanumanth Tours and Travels" }],
  openGraph: {
    title: "Sri Hanumanth Tours and Travels | Taxi & Cab Service in Mumbai",
    description:
      "Book affordable AC taxi & cab service in Mumbai. Local & outstation car rental, airport pickup & drop. Call 8779300154.",
    url: "https://srihtt.in",
    siteName: "Sri Hanumanth Tours and Travels",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sri Hanumanth Tours and Travels | Taxi Service in Mumbai",
    description:
      "Book affordable AC taxi & cab service in Mumbai. Local & outstation, airport pickup. Call 8779300154.",
  },
  alternates: {
    canonical: "https://srihtt.in",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Sri Hanumanth Tours and Travels",
              url: "https://srihtt.in",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://srihtt.in/?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Sri Hanumanth Tours and Travels",
              alternateName: [
                "Sri Hanumanth Tours and Travels",
                "Sri Hanumanth Travels",
                "Sri Hanumant Tours and Travels",
              ],
              description:
                "AC car & taxi rental service in Mumbai. Local, outstation, and airport cab booking. Innova Crysta, Ertiga, Swift Dzire.",
              url: "https://srihtt.in",
              telephone: ["+918779300154", "+919029000340"],
              email: "vijaytiwariaachal@gmail.com",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Krishna Dham 6, Station Road",
                addressLocality: "Mira Road (E)",
                addressRegion: "Maharashtra",
                postalCode: "401107",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 19.2812,
                longitude: 72.8685,
              },
              areaServed: {
                "@type": "City",
                name: "Mumbai",
              },
              serviceType: [
                "Taxi Service",
                "Cab Booking",
                "Car Rental",
                "Airport Pickup and Drop",
                "Outstation Cab",
              ],
              priceRange: "$$",
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "00:00",
                closes: "23:59",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <div className="relative">
          <AdminLink />
          {children}
        </div>
      </body>
    </html>
  );
}
