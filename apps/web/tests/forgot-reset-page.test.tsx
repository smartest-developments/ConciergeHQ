import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from '../src/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../src/pages/ResetPasswordPage';

afterEach(() => {
  cleanup();
});

describe('Forgot/Reset auth pages', () => {
  it('shows a deterministic recovery confirmation on forgot-password submit', () => {
    render(
      <MemoryRouter initialEntries={['/auth/forgot']}>
        <Routes>
          <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('If this email exists, a reset link will be sent.')).toBeTruthy();
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

  it('accepts valid reset-token and matching password fields', () => {
    render(
      <MemoryRouter initialEntries={['/auth/reset?token=test-token']}>
        <Routes>
          <Route path="/auth/reset" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'strong-pass' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'strong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(
      screen.getByText('Password reset submitted. You can now sign in with the new password once API endpoints are connected.')
    ).toBeTruthy();
  });
});
