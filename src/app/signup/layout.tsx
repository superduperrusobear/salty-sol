import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Salty Sol",
  description: "Join Salty Sol for exclusive access to our private betting platform",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 