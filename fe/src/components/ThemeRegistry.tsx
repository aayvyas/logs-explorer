'use client';

// Deprecated: Material UI Theme Registry is removed in favor of shadcn/ui + Tailwind.
// This component now just renders children to prevent breaking imports if any.

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
