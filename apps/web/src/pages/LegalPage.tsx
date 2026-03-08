export function LegalPage() {
  return (
    <section className="card" aria-labelledby="legal-title">
      <h2 id="legal-title">Legal policies</h2>
      <p>Last updated: 2026-03-08</p>
      <p>
        Acquisition Concierge is an informational sourcing service. We are not the merchant of record and do
        not process item-purchase funds.
      </p>

      <h3 id="legal-privacy">Privacy Policy</h3>
      <p>
        We process only account, sourcing-request, and security/compliance data required to deliver the
        service. Authenticated users can submit GDPR export and deletion requests through in-product controls.
      </p>
      <ul>
        <li>Data minimization and purpose limitation for service + security operations.</li>
        <li>Retention only for legal/compliance and incident-response needs.</li>
        <li>Jurisdiction and restriction scope aligns with EU + CH service boundaries.</li>
      </ul>

      <h3 id="legal-terms">Terms of Service</h3>
      <p>
        Final pricing, shipping, and after-sales obligations remain with the external merchant. The sourcing
        fee is non-refundable once work begins because it pays for research and proposal preparation.
      </p>
      <ul>
        <li>Proposal links are time-limited and may expire.</li>
        <li>Users remain responsible for customs/import obligations where applicable.</li>
        <li>Unsupported categories and geographies remain out of scope.</li>
      </ul>
    </section>
  );
}
