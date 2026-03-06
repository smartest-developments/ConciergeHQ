import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from '../src/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../src/pages/ResetPasswordPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Forgot/Reset auth pages', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' })
    } as Response);
  });

  it('shows a deterministic recovery confirmation on forgot-password submit', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/forgot']}>
        <Routes>
          <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('If this email exists, a reset link will be sent.')).toBeTruthy();
  });

  it('validates reset-token presence before accepting password reset', () => {
    render(
      <MemoryRouter initialEntries={['/auth/reset']}>
        <Routes>
          <Route path="/auth/reset" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'strong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(screen.getByText('Reset token is missing or invalid.')).toBeTruthy();
  });

  it('accepts valid reset-token and matching password fields', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/reset?token=12345678901234567890123456789012']}>
        <Routes>
          <Route path="/auth/reset" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'strong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Password reset successful. You can now sign in with your new password.')).toBeTruthy();
  });

  it('shows a deterministic forgot-password error when API validation fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'VALIDATION_ERROR' })
    } as Response);

    render(
      <MemoryRouter initialEntries={['/auth/forgot']}>
        <Routes>
          <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText('Email is invalid.')).toBeTruthy();
  });

  it('maps invalid reset-token API errors to user-safe copy', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'INVALID_RESET_TOKEN' })
    } as Response);

    render(
      <MemoryRouter initialEntries={['/auth/reset?token=12345678901234567890123456789012']}>
        <Routes>
          <Route path="/auth/reset" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'strong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Reset token is missing, expired, or invalid.')).toBeTruthy();
  });
});
