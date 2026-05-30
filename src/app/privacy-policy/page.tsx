import { PolicyPageShell } from "@/components/policy/PolicyPageShell";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageShell
      eyebrow="Gene Privacy"
      title="Privacy Policy for Gene"
      updatedAt="May 09, 2026"
      sections={[
        {
          heading: "Introduction",
          body: [
            "Welcome to Gene (\"Gene\", \"we\", \"our\", or \"us\"). This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the Gene website, applications, and services.",
            "By using Gene, you agree to the practices described in this Privacy Policy.",
            "Gene is committed to protecting your privacy and handling your information transparently and securely. Modern privacy policies commonly explain what information is collected, why it is collected, how cookies and analytics work, and users’ privacy rights.",
          ],
        },
        {
          heading: "Information We Collect",
          body: [
            "A. Personal Information: When you use Gene, create an account, purchase services, or contact support, we may collect full name, email address, phone number, billing information, country and city, travel preferences, account credentials, payment-related details, and profile information.",
            "B. Travel Planning Information: To provide AI travel planning services, we may collect destinations, travel dates, budgets, traveler counts, family or couple preferences, hotel preferences, transportation preferences, activity interests, dietary preferences, and special requests.",
            "C. Automatically Collected Information: Like most modern websites, we automatically collect technical and usage information, including IP address, browser type, device type, operating system, pages visited, time spent on pages, referral URLs, click behavior, and session information.",
            "Websites commonly collect this information to improve functionality, analytics, security, and user experience.",
          ],
        },
        {
          heading: "How We Use Your Information",
          body: [
            "We use collected information to provide AI travel planning services, generate personalized itineraries, process payments, manage accounts, improve recommendation accuracy, enhance user experience, prevent fraud and abuse, analyze website performance, provide customer support, send important service updates, improve AI systems and platform functionality, and personalize content and recommendations.",
            "We may also use aggregated and anonymized data for analytics and business improvement purposes.",
          ],
        },
        {
          heading: "Cookies and Tracking Technologies",
          body: [
            "Gene uses cookies and similar technologies to improve website functionality and user experience.",
            "Cookies may be used for login sessions, user preferences, analytics, website performance, security, affiliate tracking, and marketing attribution.",
            "Many privacy and cookie regulations require transparency regarding tracking and affiliate cookies.",
            "You can control cookies through your browser settings. Disabling cookies may affect some features of the website.",
          ],
        },
        {
          heading: "Analytics and Tracking Tools",
          body: [
            "Gene may use third-party analytics and tracking services such as Google Analytics, Meta Pixel, conversion tracking tools, affiliate tracking systems, and heatmaps or performance tools.",
            "These tools help us understand user behavior and improve our services. Analytics tools commonly collect device and usage information.",
          ],
        },
        {
          heading: "Affiliate Links and Third-Party Services",
          body: [
            "Gene may contain affiliate links to hotels, flights, tours, transportation providers, events, booking websites, and other travel-related services.",
            "When you click affiliate links, third-party websites may collect information about you, third-party cookies may be placed on your browser, tracking systems may record referral activity, and external websites operate under their own privacy policies.",
            "Affiliate marketing commonly relies on cookies and tracking technologies.",
            "Gene is not responsible for the privacy practices of external websites or providers. We strongly encourage users to review the privacy policies of third-party services before making purchases.",
          ],
        },
        {
          heading: "Payment Information",
          body: [
            "Payments are processed through secure third-party payment providers.",
            "Gene does not directly store complete credit card or banking information on its servers.",
            "Payment providers may collect billing information, payment method details, fraud prevention data, and transaction records. These providers operate under their own privacy and security policies.",
          ],
        },
        {
          heading: "Data Sharing",
          body: [
            "Gene does not sell personal information to third parties.",
            "We may share limited information with payment processors, travel API providers, analytics providers, cloud hosting providers, customer support tools, fraud prevention services, and legal authorities when required by law.",
            "We only share information necessary to operate the platform and provide services.",
          ],
        },
        {
          heading: "Data Security",
          body: [
            "We implement reasonable technical and organizational security measures to protect user information, including secure hosting infrastructure, HTTPS encryption, access controls, database protection, authentication systems, and monitoring and logging systems.",
            "However, no online system is completely secure. Users acknowledge that internet-based services carry inherent security risks.",
          ],
        },
        {
          heading: "Data Retention",
          body: [
            "We retain information only as long as reasonably necessary for service delivery, legal compliance, fraud prevention, analytics, and business operations.",
            "We may retain certain records longer when legally required.",
          ],
        },
        {
          heading: "International Users",
          body: [
            "Gene may operate globally.",
            "By using the platform, you understand that your information may be processed and stored in countries outside your own jurisdiction.",
            "Different countries may have different privacy laws and protections.",
          ],
        },
        {
          heading: "User Rights",
          body: [
            "Depending on your location and applicable laws, you may have rights to access your information, correct inaccurate information, request deletion, restrict processing, withdraw consent, request data export, and object to certain uses of data.",
            "To request privacy-related actions, contact us using the details below.",
          ],
        },
        {
          heading: "Children’s Privacy",
          body: [
            "Gene is not intended for children under the minimum legal age required in their jurisdiction.",
            "We do not knowingly collect personal information from children without appropriate authorization where required.",
            "Parents or guardians who believe a child provided information may contact us for removal requests.",
          ],
        },
        {
          heading: "Third-Party Links",
          body: [
            "Our website may contain links to external websites and services.",
            "We are not responsible for external content, external privacy policies, third-party security practices, or third-party tracking systems. Users access third-party websites at their own risk.",
          ],
        },
        {
          heading: "Changes to This Privacy Policy",
          body: [
            "Gene may update this Privacy Policy from time to time.",
            "Updated versions become effective immediately once published on the website.",
            "Continued use of Gene after updates means you accept the revised Privacy Policy.",
          ],
        },
        {
          heading: "Contact Information",
          body: [
            "If you have questions about this Privacy Policy or your personal information, contact: Email: support@gene.com",
          ],
        },
        {
          heading: "Affiliate Disclosure",
          body: [
            "Gene participates in affiliate marketing programs and may earn commissions when users book hotels, flights, activities, transportation, or other travel services through affiliate links on our platform.",
            "This means some links on Gene are affiliate links, Gene may receive compensation from travel providers, users do not usually pay additional costs because of affiliate commissions, and affiliate relationships help support and maintain the platform.",
            "We only aim to recommend services and providers that are relevant and useful to users.",
            "Affiliate disclosures and transparency are commonly recommended under advertising and consumer protection standards.",
            "Gene does not guarantee third-party pricing, availability, service quality, booking outcomes, or provider accuracy. All bookings remain subject to the policies and terms of the external provider.",
          ],
        },
      ]}
    />
  );
}
