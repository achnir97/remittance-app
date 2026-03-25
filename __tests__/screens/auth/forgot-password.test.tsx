import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

import ForgotPasswordScreen from '../../../app/(auth)/forgot-password';
import { supabase } from '../../../lib/supabase';

const mockReset = supabase.auth.resetPasswordForEmail as jest.Mock;
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    replace: mockRouterReplace,
    push: jest.fn(),
  }),
  useSegments: () => [],
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ForgotPasswordScreen', () => {
  it('renders email input', () => {
    const { getByPlaceholderText } = render(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('renders send reset link button', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    expect(getByText('Send Reset Link')).toBeTruthy();
  });

  it('renders back to sign in link', () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    expect(getByText('Sign in')).toBeTruthy();
  });

  it('shows alert when email is empty', async () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Send Reset Link'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing email',
        'Please enter your email address.'
      );
    });
  });

  it('calls resetPasswordForEmail with trimmed lowercase email', async () => {
    mockReset.mockResolvedValueOnce({ error: null });
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), '  USER@TEST.COM  ');
    await act(async () => { fireEvent.press(getByText('Send Reset Link')); });

    expect(mockReset).toHaveBeenCalledWith('user@test.com');
  });

  it('shows success state after sending reset link', async () => {
    mockReset.mockResolvedValueOnce({ error: null });
    const { getByText, getByPlaceholderText, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    await act(async () => { fireEvent.press(getByText('Send Reset Link')); });

    expect(await findByText('Check your email')).toBeTruthy();
    expect(await findByText('Back to Sign In')).toBeTruthy();
  });

  it('shows error alert on reset failure', async () => {
    mockReset.mockResolvedValueOnce({ error: { message: 'User not found' } });
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'nobody@test.com');
    await act(async () => { fireEvent.press(getByText('Send Reset Link')); });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'User not found');
  });

  it('does not show success state on failure', async () => {
    mockReset.mockResolvedValueOnce({ error: { message: 'User not found' } });
    const { getByText, getByPlaceholderText, queryByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'nobody@test.com');
    await act(async () => { fireEvent.press(getByText('Send Reset Link')); });

    expect(queryByText('Back to Sign In')).toBeNull();
    expect(queryByText('Send Reset Link')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const { UNSAFE_getByType } = render(<ForgotPasswordScreen />);
    const { getByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Sign in'));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('does not call resetPasswordForEmail when email is empty', async () => {
    const { getByText } = render(<ForgotPasswordScreen />);
    await act(async () => { fireEvent.press(getByText('Send Reset Link')); });
    expect(mockReset).not.toHaveBeenCalled();
  });
});
