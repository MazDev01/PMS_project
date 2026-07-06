"use client";

import { StoreProvider } from "@/app/lib/store";
import { AuthProvider } from "@/app/lib/auth";

export default function Providers({ children }) {
  return (
    <StoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}
