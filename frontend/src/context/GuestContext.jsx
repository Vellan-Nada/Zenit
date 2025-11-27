import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GuestContext = createContext(null);

export const GuestProvider = ({ children }) => {
  const [guestData, setGuestData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('everday_guest_data');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('everday_guest_data', JSON.stringify(guestData));
    } catch {
      // ignore persistence failures
    }
  }, [guestData]);

  const value = useMemo(
    () => ({
      guestData,
      setGuestData,
    }),
    [guestData]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};

export const useGuest = () => useContext(GuestContext);
