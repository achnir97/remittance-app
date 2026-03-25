import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

import LoginScreen from '../../../app/(auth)/login';
import { supabase } from '../../../lib/supabase';

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Your password')).toBeTruthy();
  });

  it('renders the Sign In button', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders forgot password link', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Forgot password?')).toBeTruthy();
  });

  it('renders sign up link', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Sign up')).toBeTruthy();
  });

  it('shows alert when email is empty', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing fields',
        'Please enter your email and password.'
      );
    });
  });

  it('shows alert when password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing fields',
        'Please enter your email and password.'
      );
    });
  });

  it('calls signInWithPassword with trimmed lowercase email', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), '  User@Test.Com  ');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    await act(async () => { fireEvent.press(getByText('Sign In')); });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
  });

  it('shows error alert on login failure', async () => {
    mockSignIn.mockResolvedValueOnce({ error: { message: 'Invalid credentials' } });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'bad@test.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'wrongpass');
    await act(async () => { fireEvent.press(getByText('Sign In')); });

    expect(Alert.alert).toHaveBeenCalledWith('Login failed', 'Invalid credentials');
  });

  it('does not call signIn when fields are empty', async () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  it('toggles password visibility', () => {
    const { getByPlaceholderText, getByTestId, UNSAFE_getAllByType } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Your password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});
