import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPage } from '../src/pages/RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        }
      }
    });
  });

  it('stores a customer session after valid registration input', () => {
    render(
      <MemoryRouter initialEntries={['/auth/register?next=%2Fdashboard']}>
        <Routes>
          <Route path="/auth/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'strong-pass' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(window.localStorage.getItem('acq_auth_session')).toContain('newuser@example.com');
    expect(window.localStorage.getItem('acq_auth_session')).toContain('CUSTOMER');
  });

  it('shows validation error for mismatched passwords', () => {
    render(
      <MemoryRouter initialEntries={['/auth/register']}>
        <Routes>
          <Route path="/auth/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'wrong-pass' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Password confirmation does not match.')).toBeTruthy();
  });
});
