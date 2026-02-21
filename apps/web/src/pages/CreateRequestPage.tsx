import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest, fetchCategories } from '../api';

const countries = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
];

export function CreateRequestPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: localStorage.getItem('acq_user_email') ?? 'demo@acquisitionconcierge.ch',
    budgetChf: 1000,
    specs: '',
    category: 'ELECTRONICS',
    condition: 'USED',
    country: 'CH',
    urgency: 'STANDARD'
  });

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
      <form onSubmit={onSubmit} className="card form-grid">
        <label>
          Email
          <input
            type="email"
            value={formData.userEmail}
            onChange={(event) => setFormData((prev) => ({ ...prev, userEmail: event.target.value }))}
            required
          />
        </label>

        <label>
          Budget (CHF)
          <input
            type="number"
            min={1}
            value={formData.budgetChf}
            onChange={(event) => setFormData((prev) => ({ ...prev, budgetChf: Number(event.target.value) }))}
            required
          />
        </label>

        <label>
          Category
          <select
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

        <label>
          Condition
          <select
            value={formData.condition}
            onChange={(event) => setFormData((prev) => ({ ...prev, condition: event.target.value }))}
          >
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
        </label>

        <label>
          Country (EU + CH)
          <select
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

        <label>
          Urgency
          <select
            value={formData.urgency}
            onChange={(event) => setFormData((prev) => ({ ...prev, urgency: event.target.value }))}
          >
            <option value="STANDARD">Standard</option>
            <option value="FAST">Fast</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <label className="full-width">
          Specifications
          <textarea
            minLength={10}
            value={formData.specs}
            onChange={(event) => setFormData((prev) => ({ ...prev, specs: event.target.value }))}
            placeholder="Describe item expectations, preferred brands, must-haves, constraints."
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </section>
  );
}
