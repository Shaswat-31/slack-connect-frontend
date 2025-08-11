"use client";

import React, { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      {children}
    </Suspense>
  );
}
