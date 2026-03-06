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
      <MemoryRouter initialEntries={['/auth/session?next=%2Foperator%2Fqueue']}>
        <Routes>
          <Route path="/auth/session" element={<SessionBootstrapPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    expect(window.localStorage.getItem('acq_auth_session')).toContain('admin@example.com');
    expect(window.localStorage.getItem('acq_auth_session')).toContain('ADMIN');
  });
});
