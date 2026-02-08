import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-900 border border-zinc-800",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
              footerActionLink: "text-violet-400 hover:text-violet-300",
              identityPreviewEditButton: "text-violet-400",
            },
          }}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/analyze"
        />
      </main>
    </div>
  );
}
