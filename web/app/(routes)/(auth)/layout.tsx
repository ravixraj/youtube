import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UTube | Welcome",
  description: "Signin and Signup to UTube",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      <div className="mx-auto my-8 flex w-full max-w-sm flex-col px-4">
        {children}
      </div>
    </div>
  );
}
