import React, { createContext, useContext, useEffect, useState } from 'react';

interface PrivacyContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
  setHideValues: (hide: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  hideValues: false,
  toggleHideValues: () => {},
  setHideValues: () => {},
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideValues, setHideValuesState] = useState<boolean>(() => {
    return localStorage.getItem('extratopixelnexo_hide_values') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('extratopixelnexo_hide_values', String(hideValues));
  }, [hideValues]);

  const toggleHideValues = () => setHideValuesState((prev) => !prev);
  const setHideValues = (hide: boolean) => setHideValuesState(hide);

  return (
    <PrivacyContext.Provider value={{ hideValues, toggleHideValues, setHideValues }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
