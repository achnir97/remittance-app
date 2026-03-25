/**
 * Tests for the protected routing logic in app/_layout.tsx.
 *
 * The routing logic derives the redirect target from three inputs:
 *   - user      (authenticated or not)
 *   - userType  (onboarding complete or not)
 *   - segments  (current route group)
 *
 * We extract the pure decision function to test it in isolation, keeping
 * the test file free of React rendering complexity.
 */

type Segment = '(auth)' | '(onboarding)' | '(tabs)' | string;

type RoutingState = {
  user: { id: string } | null;
  userType: string | null;
  segments: [Segment, ...string[]];
};

type Redirect = string | null;

/**
 * Pure routing logic extracted from _layout.tsx useEffect.
 * Returns the route to navigate to, or null if no redirect needed.
 */
function getRedirect({ user, userType, segments }: RoutingState): Redirect {
  const inAuthGroup = segments[0] === '(auth)';
  const inOnboarding = segments[0] === '(onboarding)';

  if (!user) {
    if (!inAuthGroup) return '/(auth)/login';
    return null;
  }

  if (user && inAuthGroup) {
    return userType ? '/(tabs)/home' : '/(onboarding)/user-type';
  }

  if (user && !userType && !inOnboarding) {
    return '/(onboarding)/user-type';
  }

  if (user && userType && inOnboarding) {
    return '/(tabs)/home';
  }

  return null;
}

// ── State helpers ─────────────────────────────────────────────────────────────

const USER = { id: 'user-123' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('_layout protected routing', () => {
  describe('unauthenticated user', () => {
    it('redirects to login when on a non-auth route', () => {
      expect(getRedirect({ user: null, userType: null, segments: ['(tabs)'] }))
        .toBe('/(auth)/login');
    });

    it('redirects to login when on an onboarding route', () => {
      expect(getRedirect({ user: null, userType: null, segments: ['(onboarding)'] }))
        .toBe('/(auth)/login');
    });

    it('does NOT redirect when already on an auth route', () => {
      expect(getRedirect({ user: null, userType: null, segments: ['(auth)'] }))
        .toBeNull();
    });
  });

  describe('authenticated user on auth route (just logged in)', () => {
    it('redirects to home when userType is set', () => {
      expect(getRedirect({ user: USER, userType: 'worker', segments: ['(auth)'] }))
        .toBe('/(tabs)/home');
    });

    it('redirects to user-type onboarding when userType is not set', () => {
      expect(getRedirect({ user: USER, userType: null, segments: ['(auth)'] }))
        .toBe('/(onboarding)/user-type');
    });
  });

  describe('authenticated user missing userType outside onboarding', () => {
    it('redirects to onboarding when on tabs route', () => {
      expect(getRedirect({ user: USER, userType: null, segments: ['(tabs)'] }))
        .toBe('/(onboarding)/user-type');
    });

    it('does NOT redirect when already in onboarding', () => {
      expect(getRedirect({ user: USER, userType: null, segments: ['(onboarding)'] }))
        .toBeNull();
    });
  });

  describe('authenticated user who completed onboarding', () => {
    it('redirects to home when still on onboarding route', () => {
      expect(getRedirect({ user: USER, userType: 'student', segments: ['(onboarding)'] }))
        .toBe('/(tabs)/home');
    });

    it('does NOT redirect when already on home route', () => {
      expect(getRedirect({ user: USER, userType: 'student', segments: ['(tabs)'] }))
        .toBeNull();
    });

    it('does NOT redirect when on a nested tabs route', () => {
      expect(getRedirect({ user: USER, userType: 'professional', segments: ['(tabs)', 'dashboard'] }))
        .toBeNull();
    });
  });
});
