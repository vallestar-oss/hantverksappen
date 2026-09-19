// Remembers, per user and per browser, that the first-login onboarding is done.
// localStorage can throw (private mode, blocked storage), so failures are
// swallowed: the worst case is that onboarding is offered again.

const keyFor = userId => `hv_onboarded_${userId}`

export function isOnboardingDone(userId) {
  try {
    return localStorage.getItem(keyFor(userId)) === '1'
  } catch {
    return false
  }
}

export function markOnboardingDone(userId) {
  try {
    localStorage.setItem(keyFor(userId), '1')
  } catch {
    // Ignore — see above.
  }
}
