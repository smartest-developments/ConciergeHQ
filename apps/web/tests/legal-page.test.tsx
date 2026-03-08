import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LegalPage } from '../src/pages/LegalPage';

describe('LegalPage', () => {
  it('renders privacy and terms sections', () => {
    render(<LegalPage />);

    expect(screen.getByRole('heading', { name: 'Legal policies' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeTruthy();
    expect(screen.getByText(/non-refundable once work begins/i)).toBeTruthy();
  });
});
