import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../src/components/AppShell';

describe('AppShell', () => {
  it('renders the product title', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );

    expect(screen.getByText('Acquisition Concierge')).toBeTruthy();
  });
});
