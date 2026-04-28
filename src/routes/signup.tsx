import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandLink } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) toast.error(error);
    else {
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto max-w-7xl w-full px-6 py-6"><BrandLink /></header>
      <main className="flex-1 grid place-items-center px-6 py-12">
        <div className="spotlight relative w-full max-w-md border border-border bg-card p-10">
          <div className="text-xs tracking-[0.4em] text-gold mb-2">JOIN CERTIGEN</div>
          <h1 className="font-display text-3xl tracking-[0.08em] mb-8">CREATE ACCOUNT</h1>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground">NAME</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground">EMAIL</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground">PASSWORD</Label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 bg-input border-border" />
            </div>
            <Button type="submit" disabled={loading} className="w-full font-heading tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 h-11">
              {loading ? "..." : "CREATE ACCOUNT →"}
            </Button>
          </form>
          <div className="hairline my-6" />
          <p className="text-sm text-muted-foreground text-center">
            Already have one? <Link to="/login" className="text-gold hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
