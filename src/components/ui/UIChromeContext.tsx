"use client";

import { createContext, ReactNode, useState } from "react";

type UIChromeContextValue = {
  hideBottomTabs: boolean;
  setHideBottomTabs: (value: boolean) => void;
};

export const UIChromeContext = createContext<UIChromeContextValue>({
  hideBottomTabs: false,
  setHideBottomTabs: () => {},
});

export function UIChromeProvider({ children }: { children: ReactNode }) {
  const [hideBottomTabs, setHideBottomTabs] = useState(false);
  return (
    <UIChromeContext.Provider value={{ hideBottomTabs, setHideBottomTabs }}>
      {children}
    </UIChromeContext.Provider>
  );
}
