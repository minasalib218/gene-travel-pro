import { PolicyPageShell } from "@/components/policy/PolicyPageShell";

export default function RefundPolicyPage() {
  return (
    <PolicyPageShell
      eyebrow="Gene Refund Policy"
      title="Gene Refund Policy"
      updatedAt="May 09, 2026"
      sections={[
        {
          heading: "Policy Scope",
          body: [
            "This Refund Policy applies only to services purchased directly from Gene through our website and payment systems.",
            "By purchasing any service from Gene, you acknowledge that you have read, understood, and agreed to this Refund Policy.",
          ],
        },
        {
          heading: "Nature of Our Service",
          body: [
            "Gene provides digital AI-powered travel planning services, including but not limited to AI-generated travel itineraries, personalized travel recommendations, travel analysis and optimization, day-by-day trip planning, smart itinerary editing, and travel-related digital recommendations and suggestions.",
            "Gene does not own, operate, manage, or directly provide airlines, hotels, car rental companies, event organizers, transportation providers, booking platforms, or third-party travel services.",
            "All bookings made through external providers are subject to the policies, terms, pricing, availability, cancellation rules, and refund conditions of those third-party providers.",
          ],
        },
        {
          heading: "Third-Party Bookings Disclaimer",
          body: [
            "Any hotel, flight, transportation, activity, event, or travel booking made through third-party websites, APIs, affiliate links, or providers is governed solely by the policies of those providers.",
            "Gene is not responsible for third-party cancellations, airline schedule changes, hotel overbookings, visa issues, weather disruptions, refund refusals from providers, booking provider errors, pricing changes, currency fluctuations, travel restrictions, or service interruptions caused by third parties.",
            "Refund requests for external bookings must be submitted directly to the relevant booking provider. Gene cannot guarantee refunds from any third-party booking platform.",
          ],
        },
        {
          heading: "Refund Eligibility for Gene Services",
          body: [
            "Refunds are available only if the purchased Gene service has not been used.",
            "A service is considered used once any of the following occurs: the AI plan generation process starts, a recommendation page is generated, an analysis page is generated, travel recommendations are displayed, any itinerary or travel plan is created, any AI request or credit is consumed, any paid feature is accessed, any generated result becomes visible to the customer, any customization or edit action is performed, or the service is partially or fully delivered.",
            "Once the service has been used, accessed, generated, delivered, or consumed in any form, the purchase becomes non-refundable.",
          ],
        },
        {
          heading: "Approved Refunds",
          body: [
            "If the service has not been used, customers may request a refund within 14 days from the purchase date.",
            "Approved refunds will be returned to the original payment method. Refund processing times may vary depending on the payment provider or bank.",
          ],
        },
        {
          heading: "Transaction Fees and Non-Refundable Charges",
          body: [
            "For approved refunds, Gene reserves the right to deduct payment gateway processing fees, currency conversion fees, banking charges, transaction fees, tax-related charges, and non-refundable third-party payment costs.",
            "This deduction exists because many payment processors do not return transaction fees after refunds are issued.",
            "The refunded amount may therefore be lower than the original payment amount.",
          ],
        },
        {
          heading: "Non-Refundable Situations",
          body: [
            "Refunds will not be issued if the service has been used in any way, AI generations or recommendations were accessed, the customer changed travel preferences after delivery, the customer no longer wishes to travel, or if the issue relates to visa rejection, airline cancellations, hotel issues, third-party booking disputes, weather conditions, government restrictions, force majeure events, user input mistakes, incorrect traveler information submitted by the customer, dissatisfaction caused by third-party services, delays caused by external APIs or providers, failure to read service details before purchase, or subscription renewals not canceled before billing.",
          ],
        },
        {
          heading: "Accuracy Disclaimer",
          body: [
            "Gene uses AI systems, APIs, provider integrations, and automated engines to generate travel recommendations and analysis.",
            "Although we strive for high accuracy, Gene does not guarantee absolute pricing accuracy, real-time availability at all times, continuous provider availability, error-free recommendations, guaranteed booking confirmation, or guaranteed travel outcomes.",
            "Travel information may change rapidly due to provider updates, weather, local regulations, or external events. Customers remain responsible for independently reviewing and confirming booking details before making purchases.",
          ],
        },
        {
          heading: "Chargebacks and Payment Disputes",
          body: [
            "Before initiating a chargeback or payment dispute, customers agree to contact Gene support first to attempt resolution.",
            "Fraudulent or abusive chargebacks may result in permanent account suspension, service access termination, restriction from future purchases, and submission of dispute evidence to payment providers.",
            "Gene reserves the right to defend itself against invalid chargeback claims.",
          ],
        },
        {
          heading: "Subscription and Credit Usage",
          body: [
            "If your plan includes AI credits, request limits, edit limits, passes, or usage quotas, any consumed credit or request will be considered service usage and therefore becomes non-refundable.",
            "Unused remaining credits do not guarantee partial refunds unless required by applicable law.",
          ],
        },
        {
          heading: "Cancellation Policy",
          body: [
            "Customers may cancel future subscription renewals at any time before the next billing cycle.",
            "Cancellation stops future billing only. Cancellation does not automatically create eligibility for refunds on already purchased or partially used services.",
          ],
        },
        {
          heading: "Force Majeure",
          body: [
            "Gene is not liable for delays, interruptions, or inability to provide services caused by events outside reasonable control, including natural disasters, war, internet outages, government restrictions, API outages, cyber attacks, airline disruptions, provider failures, pandemics, and power outages.",
            "Such situations do not automatically qualify for refunds.",
          ],
        },
      ]}
    />
  );
}
