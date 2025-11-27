export const goToSignup = (guestData) => {
  try {
    window.__suppressLeaveWarning = true;
    if (guestData) {
      sessionStorage.setItem('everday_guest_data', JSON.stringify(guestData));
    }
  } catch {
    // ignore storage errors
  }
  window.location.href = '/signup';
};

