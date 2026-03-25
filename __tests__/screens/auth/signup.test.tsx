import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

import SignupScreen from '../../../app/(auth)/signup';
import { supabase } from '../../../lib/supabase';

const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockRouterReplace = jest.fn();

// Override useRouter for this file
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

function fillForm(
  utils: ReturnType<typeof render>,
  {
    name = 'Test User',
    email = 'test@example.com',
    password = 'password123',
    confirm = 'password123',
  } = {}
) {
  fireEvent.changeText(utils.getByPlaceholderText('Your name'), name);
  fireEvent.changeText(utils.getByPlaceholderText('you@example.com'), email);
  fireEvent.changeText(utils.getByPlaceholderText('At least 6 characters'), password);
  fireEvent.changeText(utils.getByPlaceholderText('Repeat your password'), confirm);
}

describe('SignupScreen', () => {
  it('renders all four input fields', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    expect(getByPlaceholderText('Your name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('At least 6 characters')).toBeTruthy();
    expect(getByPlaceholderText('Repeat your password')).toBeTruthy();
  });

  it('renders the Create Account button', () => {
    const { getByText } = render(<SignupScreen />);
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('shows alert when any field is empty', async () => {
    const { getByText } = render(<SignupScreen />);
    fireEvent.press(getByText('Create Account'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Missing fields', 'Please fill in all fields.');
    });
  });

  it('shows alert when passwords do not match', async () => {
    const utils = render(<SignupScreen />);
    fillForm(utils, { password: 'pass1234', confirm: 'pass5678' });
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });
    expect(Alert.alert).toHaveBeenCalledWith('Password mismatch', 'Passwords do not match.');
  });

  it('shows alert when password is too short', async () => {
    const utils = render(<SignupScreen />);
    fillForm(utils, { password: '123', confirm: '123' });
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Weak password',
      'Password must be at least 6 characters.'
    );
  });

  it('calls signUp with correct data on valid form', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null, data: { user: {}, session: null } });
    const utils = render(<SignupScreen />);
    fillForm(utils);
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: { data: { full_name: 'Test User' } },
    });
  });

  it('lowercases and trims email on submit', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null, data: { user: {}, session: null } });
    const utils = render(<SignupScreen />);
    fillForm(utils, { email: '  UPPER@TEST.COM  ' });
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'upper@test.com' })
    );
  });

  it('shows check email alert on successful signup', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null, data: { user: {}, session: null } });
    const utils = render(<SignupScreen />);
    fillForm(utils);
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Check your email',
      expect.stringContaining('confirmation link'),
      expect.any(Array)
    );
  });

  it('shows error alert on signup failure', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'Email already in use' } });
    const utils = render(<SignupScreen />);
    fillForm(utils);
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });

    expect(Alert.alert).toHaveBeenCalledWith('Sign up failed', 'Email already in use');
  });

  it('does not call signUp when form is incomplete', async () => {
    const utils = render(<SignupScreen />);
    fillForm(utils, { name: '' }); // missing name
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('trims full name before sending', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null, data: { user: {}, session: null } });
    const utils = render(<SignupScreen />);
    fillForm(utils, { name: '  Test User  ' });
    await act(async () => { fireEvent.press(utils.getByText('Create Account')); });

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { data: { full_name: 'Test User' } },
      })
    );
  });
});
