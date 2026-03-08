import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { SessionBootstrapPage } from '../src/pages/SessionBootstrapPage';

describe('SessionBootstrapPage', () => {
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

  it('stores session bootstrap credentials', () => {
    render(
      <MemoryRouter initialEntries={['/auth/login?next=%2Foperator%2Fqueue']}>
        <Routes>
          <Route path="/auth/login" element={<SessionBootstrapPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(window.localStorage.getItem('acq_auth_session')).toContain('admin@example.com');
    expect(window.localStorage.getItem('acq_auth_session')).toContain('ADMIN');
  });

  it('wires explicit label associations and announces validation errors', () => {
    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path="/auth/login" element={<SessionBootstrapPage />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const roleSelect = screen.getByLabelText('Role');

    expect(emailInput.getAttribute('id')).toBe('session-bootstrap-email');
    expect(roleSelect.getAttribute('id')).toBe('session-bootstrap-role');
    expect(screen.getByText('Email').getAttribute('for')).toBe('session-bootstrap-email');
    expect(screen.getByText('Role').getAttribute('for')).toBe('session-bootstrap-role');

    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const error = screen.getByText('Email is required.');
    expect(error.getAttribute('id')).toBe('session-bootstrap-error');
    expect(error.getAttribute('aria-live')).toBe('polite');
    expect(emailInput.getAttribute('aria-describedby')).toBe('session-bootstrap-error');
  });
});
