import { PolicyPageShell } from "@/components/policy/PolicyPageShell";

export default function TermsPage() {
  return (
    <PolicyPageShell
      eyebrow="Gene Travel Terms"
      title="Terms and Conditions and Refund Policy for [Gene Website]"
      updatedAt="09 May 2026"
      sections={[
        {
          heading: "Introduction",
          body: [
            "Company identification: Provide your full legal name, business name, registered address and contact details, such as support email and postal address. The introduction should clearly identify the website or application covered by this agreement.",
            "Acceptance of terms: By accessing or using the Services, users accept and agree to be bound by these Terms. Use clear language such as: By browsing or registering with the Site, you agree to comply with these Terms.",
            "Age eligibility: State the minimum age requirement to use the Services. Many platforms limit use to adults, while some allow minors with parental or guardian consent.",
            "Effective date: Include the date on which these Terms take effect and provide a mechanism to notify users of future updates.",
          ],
        },
        {
          heading: "Definitions",
          body: [
            "Include definitions of key terms used throughout the document, such as Services, Content, and User Account, to reduce ambiguity.",
          ],
        },
        {
          heading: "Eligibility and Account Registration",
          body: [
            "Eligibility: Only persons who meet the minimum age requirement and are legally competent to enter into contracts may use the Services. If the Service is intended for adults, minors may only use it with the consent of a parent or guardian.",
            "Account creation: Users may be required to create an account and provide accurate, current and complete information. Users must update their information when it changes and keep their login credentials confidential. Users are responsible for all activities that occur under their account.",
            "Security: Users must notify the Company immediately of any unauthorized use or security breach. The Company is not liable for losses arising from unauthorized access.",
          ],
        },
        {
          heading: "Permitted and Prohibited Use",
          body: [
            "Permitted use: Describe legitimate ways to use the Services, such as browsing content, registering for an account, purchasing services, and submitting feedback. Users should use the Services for lawful and personal purposes.",
            "Prohibited conduct: Clearly list activities that are not allowed, such as spamming, hacking, malware distribution, attempting to bypass security measures, infringing intellectual property rights, harassment, and other unlawful or harmful activities.",
            "Suspension and monitoring: Explain that the Company may monitor use of the Services and suspend or terminate accounts that violate these Terms.",
          ],
        },
        {
          heading: "Services and Content",
          body: [
            "Description of Services: Provide an overview of the Services offered via the Site. If the platform offers travel planning, recommendations, subscriptions, or research tools, describe the core functions and any limitations.",
            "Changes to Services: The Company may modify, update, or discontinue parts of the Services at its discretion. Users should regularly review the Terms and the Site for updates.",
            "Third-party content: The Services may integrate third-party payment processors, analytics tools, or social logins and may link to third-party websites. These third parties operate independently and have their own terms and privacy policies. Users access them at their own risk, and the Company is not liable for loss or damage arising from such use.",
          ],
        },
        {
          heading: "Payment, Pricing and Billing",
          body: [
            "Pricing and fees: Clearly display pricing, subscription terms, and billing cycles. Specify accepted payment methods, applicable taxes, and whether prices include taxes or other charges. If charges are recurring, describe the auto-renewal process and how to cancel.",
            "Payment processing: Our payments are processed through third-party providers. You authorize our payment processor to charge your selected payment method for fees, taxes, and other amounts due. According to Stripe support documentation, payment processing and currency conversion fees from the original transaction are not returned when a refund is issued. Therefore, if you receive a refund, those non-refundable processing fees will be deducted.",
            "Failed payments: If a payment fails or is declined, the Company may suspend access to the Services until payment is received.",
          ],
        },
        {
          heading: "Refund and Cancellation Policy",
          body: [
            "Refund eligibility: You may request a refund only if you have not accessed or used the purchased service. Because our Services involve digital content and may be delivered instantly, once you use or access the service, it cannot be returned. The Competition and Consumer Protection Commission notes that consumers have a 14-day withdrawal period for digital services purchased online, but they will be charged a reasonable cost for any digital content or services used before cancellation. Moreover, the right to cancel does not apply once the digital service has been fully provided and the consumer agreed to waive the cancellation right.",
            "Non-returnable digital services: Digital products cannot be physically returned. Customers cannot actually return a digital product once it has been downloaded, and many businesses therefore do not offer refunds on digital items, although some provide refunds under limited circumstances. Our Services fall into this category: once you have accessed the service, all sales are final and no refunds will be granted.",
            "Partial refunds and transaction fees: In the event of an approved refund where you have not accessed the service, we will deduct any non-refundable payment processing fees. Payment processors such as Stripe do not return processing fees on refunded payments, and some processors explicitly keep these fees. We may also deduct direct taxes or charges already paid on your behalf. The refund will be issued to the original payment method within a reasonable period, typically within 14 days of approval. Depending on your location, additional rights may apply.",
            "Cancellation before use: If you wish to cancel a subscription before accessing the service, contact us through the provided support email. We will process your cancellation and, if eligible, issue a refund subject to the deductions mentioned above. For subscriptions, cancellation requests should be made at least [number] days before the renewal date to avoid being charged for the next cycle.",
            "Service-based refund options: Service-based businesses often adopt one of three approaches: no refunds, no refunds with correction services, or a refund policy with strict rules and potential partial refunds. We have adopted the third option above for unused services. If you cancel after using part of the service, partial refunds are not available since digital services cannot be returned and our resources are consumed upon access.",
          ],
        },
        {
          heading: "Intellectual Property Rights",
          body: [
            "Ownership: All content on the Site, including text, images, videos, logos, software, trademarks, and service marks, is owned by or licensed to the Company and is protected by copyright, trademark, and other intellectual property laws.",
            "Limited licence: We grant you a limited, non-exclusive, non-transferable licence to access and use the Services for personal, non-commercial purposes. You may not copy, modify, reproduce, distribute, sell, lease, or create derivative works from the Site or its content without our prior written consent.",
            "Trademarks: Our trademarks and service marks, whether registered or not, may not be used in connection with any product or service that is not ours. Nothing in these Terms grants you rights to use our trademarks without our permission.",
          ],
        },
        {
          heading: "User-Generated Content",
          body: [
            "If users can submit reviews, comments, or other content, by uploading or submitting content you grant the Company a worldwide, non-exclusive, royalty-free, perpetual, irrevocable licence to use, reproduce, distribute, display, modify, and create derivative works of that content in connection with operating and promoting the Services.",
            "You are solely responsible for the content you upload. You must not submit content that is unlawful, defamatory, infringing, obscene, or otherwise objectionable. We reserve the right to monitor, edit, or remove user-generated content that violates these Terms or applicable law.",
          ],
        },
        {
          heading: "Third-Party Services and Links",
          body: [
            "The Services may contain links to third-party websites and integrate services such as payment processors or analytics providers. We do not control and are not responsible for the content, privacy policies, or practices of any third parties. Access to these services is provided for convenience and at your own risk.",
          ],
        },
        {
          heading: "Privacy and Data Protection",
          body: [
            "We are committed to protecting your privacy. Information about how we collect, use, and disclose personal data is provided in our Privacy Policy. Personal data is processed in line with the Privacy Policy and Cookie Policy. We use cookies and similar technologies to improve functionality, measure performance, and support marketing. By using the Services, you consent to our use of cookies and our privacy practices.",
          ],
        },
        {
          heading: "Disclaimers and Warranties",
          body: [
            "Service provided as is: The Services are provided as is and as available without warranties of any kind. We do not guarantee uninterrupted, secure, error-free, or virus-free service. To the maximum extent permitted by law, we exclude all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.",
            "Information accuracy: Where the Services display user-generated or third-party information, we do not endorse or guarantee its accuracy.",
            "No professional advice: Any information provided on the Site is for general informational purposes only and does not constitute legal, medical, or other professional advice.",
          ],
        },
        {
          heading: "Limitation of Liability",
          body: [
            "To the fullest extent permitted by law, the Company and its affiliates, officers, directors, and employees shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Services. Our total liability to you for any claim arising out of or relating to the Services shall not exceed the amount you paid us for the applicable service. Some jurisdictions do not allow limitations on implied warranties or liability, so these limitations may not apply to you.",
          ],
        },
        {
          heading: "Indemnification",
          body: [
            "You agree to indemnify and hold harmless the Company and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, judgments, costs, and expenses, including legal fees, arising from your use or misuse of the Services, your violation of these Terms, or your infringement of any third-party rights.",
          ],
        },
        {
          heading: "Governing Law and Dispute Resolution",
          body: [
            "These Terms and any dispute relating to them or the Services will be governed by the laws of [Jurisdiction], without regard to its conflict-of-laws rules. Disputes will be resolved through the courts located in [Jurisdiction], unless otherwise required by mandatory consumer protection laws. For certain matters, we may agree to resolve disputes through arbitration or mediation, and details will be provided where applicable.",
          ],
        },
        {
          heading: "Changes to the Terms",
          body: [
            "We reserve the right to modify or update these Terms at any time. When we make material changes, we will provide notice by updating the effective date and, where appropriate, by email or prominent notice on the Site. Continued use of the Services after changes become effective constitutes acceptance of the revised Terms.",
          ],
        },
        {
          heading: "Termination and Suspension",
          body: [
            "We may suspend or terminate your access to the Services, with or without notice, if you violate these Terms, fail to pay fees when due, or engage in unlawful or abusive behavior. We may provide a grace period or warning at our discretion. Upon termination, the rights and licences granted to you under these Terms will cease, and you must stop using the Services immediately.",
          ],
        },
        {
          heading: "Miscellaneous",
          body: [
            "Severability and Entire Agreement: If any part of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in effect. These Terms constitute the entire agreement between you and the Company regarding the Services and supersede any prior agreements.",
            "Assignment: We may assign or transfer our rights and obligations under these Terms in connection with a merger, acquisition, or sale of assets. You may not assign your rights or delegate your obligations without our prior written consent.",
            "Force Majeure: We are not liable for failure or delay in performance due to events beyond our reasonable control, such as natural disasters, war, civil unrest, government restrictions, or failures of telecommunications.",
            "No waiver: Our failure to enforce any provision does not constitute a waiver of that provision.",
            "No agency or partnership: Nothing in these Terms creates an agency, partnership, joint venture, or employment relationship between you and the Company.",
            "Feedback: By submitting ideas, suggestions, or feedback, you grant us a non-exclusive, royalty-free, perpetual, and irrevocable licence to use such feedback for any purpose without compensation.",
          ],
        },
      ]}
    />
  );
}
