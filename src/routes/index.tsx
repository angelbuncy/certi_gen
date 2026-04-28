import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { BrandLink } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  return (
    <div className="min-h-screen relative noise">
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <BrandLink />
        <nav className="flex items-center gap-3">
          <Link to="/login" className="text-sm tracking-widest text-muted-foreground hover:text-foreground transition-colors">SIGN IN</Link>
          <Link to="/signup">
            <Button variant="default" className="font-heading tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">GET STARTED</Button>
          </Link>
        </nav>
      </header>

      <section className="spotlight relative mx-auto max-w-7xl px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-xs tracking-[0.4em] text-gold mb-6">CERTIFICATE STUDIO</div>
          <h1 className="font-display text-6xl md:text-8xl tracking-[0.06em] leading-[1.05]">
            <span className="gold-gradient">DESIGN.</span>{" "}
            <span className="text-foreground">GENERATE.</span>{" "}
            <span className="gold-gradient">DELIVER.</span>
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
            Pick a template. Drop a spreadsheet. Get every certificate as a polished PDF — and have them
            mass-mailed to your participants in one click.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="font-heading tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12">
                START FREE →
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="font-heading tracking-[0.2em] border-border h-12 px-8">
                SIGN IN
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="hairline mt-24" />

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { k: "01", t: "FIVE TEMPLATES", d: "Hand-crafted noir, gold, navy and minimalist designs ready to use." },
            { k: "02", t: "DRAG & RESIZE", d: "Place name, date, course — any field — exactly where you want it." },
            { k: "03", t: "BULK DELIVER", d: "Generate a ZIP of PDFs and email each recipient automatically." },
          ].map((f) => (
            <motion.div
              key={f.k}
              whileHover={{ y: -4 }}
              className="spotlight relative border border-border bg-card p-8"
            >
              <div className="font-display text-sm tracking-[0.3em] text-gold">{f.k}</div>
              <div className="mt-4 font-heading text-2xl tracking-widest">{f.t}</div>
              <p className="mt-3 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-8 border-t border-border text-xs tracking-widest text-muted-foreground flex justify-between">
        <span>© CERTIGEN STUDIO</span>
        <span className="text-gold">EST. 2026</span>
      </footer>
    </div>
  );
}
