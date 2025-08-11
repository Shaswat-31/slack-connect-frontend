"use client";

import React, { Suspense } from "react";
import { Toaster } from "sonner";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
       <Toaster position="top-center" richColors />
      {children}
    </Suspense>
  );
}
