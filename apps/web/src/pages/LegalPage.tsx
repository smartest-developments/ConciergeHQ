export function LegalPage() {
  return (
    <section className="card" aria-labelledby="legal-title">
      <h2 id="legal-title">Legal policies</h2>
      <p>
        Acquisition Concierge is an informational sourcing service. We are not the merchant of record and do
        not process item-purchase funds.
      </p>

      <h3 id="legal-privacy">Privacy Policy</h3>
      <p>
        We collect only account and sourcing-request data required to deliver the service, support users, and
        enforce security/compliance obligations. Authenticated users can request GDPR export and deletion from
        in-product controls.
      </p>

      <h3 id="legal-terms">Terms of Service</h3>
      <p>
        Final pricing, shipping, and after-sales obligations remain with the external merchant. The sourcing
        fee is non-refundable once work begins because it pays for research and proposal preparation.
      </p>
    </section>
  );
}
