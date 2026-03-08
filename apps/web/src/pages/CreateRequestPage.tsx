import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest, fetchCategories } from '../api';
import { readAuthSession } from '../auth';

const countries = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
];

export function CreateRequestPage() {
  const navigate = useNavigate();
  const session = readAuthSession();
  const defaultEmail = session?.email ?? localStorage.getItem('acq_user_email') ?? 'demo@acquisitionconcierge.ch';
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: defaultEmail,
    budgetChf: 1000,
    specs: '',
    category: 'ELECTRONICS',
    condition: 'USED',
    country: 'CH',
    urgency: 'STANDARD'
  });

  const errorId = 'create-request-form-error';

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setError('Could not load categories from API.'));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      localStorage.setItem('acq_user_email', formData.userEmail);
      const created = await createRequest({
        ...formData,
        budgetChf: Number(formData.budgetChf),
        category: formData.category as 'ELECTRONICS' | 'HOME_APPLIANCES' | 'SPORTS_EQUIPMENT',
        condition: formData.condition as 'NEW' | 'USED',
        urgency: formData.urgency as 'STANDARD' | 'FAST' | 'CRITICAL'
      });

      navigate(`/payment/${created.id}?fee=${created.sourcingFeeChf}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request creation failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Create Sourcing Request</h2>
      <p>We source options and provide an external purchase link. We are not the merchant.</p>
      <form onSubmit={onSubmit} className="card form-grid" noValidate>
        <label htmlFor="create-request-email">
          Email
          <input
            id="create-request-email"
            type="email"
            value={formData.userEmail}
            readOnly
            required
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        <label htmlFor="create-request-budget">
          Budget (CHF)
          <input
            id="create-request-budget"
            type="number"
            min={1}
            value={formData.budgetChf}
            onChange={(event) => setFormData((prev) => ({ ...prev, budgetChf: Number(event.target.value) }))}
            required
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        <label htmlFor="create-request-category">
          Category
          <select
            id="create-request-category"
            value={formData.category}
            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="create-request-condition">
          Condition
          <select
            id="create-request-condition"
            value={formData.condition}
            onChange={(event) => setFormData((prev) => ({ ...prev, condition: event.target.value }))}
          >
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
        </label>

        <label htmlFor="create-request-country">
          Country (EU + CH)
          <select
            id="create-request-country"
            value={formData.country}
            onChange={(event) => setFormData((prev) => ({ ...prev, country: event.target.value }))}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="create-request-urgency">
          Urgency
          <select
            id="create-request-urgency"
            value={formData.urgency}
            onChange={(event) => setFormData((prev) => ({ ...prev, urgency: event.target.value }))}
          >
            <option value="STANDARD">Standard</option>
            <option value="FAST">Fast</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <label className="full-width" htmlFor="create-request-specs">
          Specifications
          <textarea
            id="create-request-specs"
            minLength={10}
            value={formData.specs}
            onChange={(event) => setFormData((prev) => ({ ...prev, specs: event.target.value }))}
            placeholder="Describe item expectations, preferred brands, must-haves, constraints."
            required
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        {error ? (
          <p id={errorId} className="error" role="status" aria-live="polite">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </section>
  );
}
