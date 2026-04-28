import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TEMPLATES, templateToDataUrl } from "@/lib/templates";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Trash2, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface Project {
  id: string;
  name: string;
  description: string | null;
  template_id: string;
  updated_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tplId, setTplId] = useState("participation");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,template_id,updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async () => {
    if (!name.trim()) return toast.error("Give your project a name");
    setCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user!.id, name: name.trim(), description: desc || null, template_id: tplId, fields: [] })
      .select("id")
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Project created");
    setOpen(false); setName(""); setDesc(""); setTplId("participation");
    navigate({ to: "/project/$id", params: { id: data.id } });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-xs tracking-[0.4em] text-gold mb-2">YOUR STUDIO</div>
          <h1 className="font-display text-4xl tracking-[0.08em]">PROJECTS</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading tracking-[0.2em]">
          <Plus className="h-4 w-4 mr-2" /> NEW PROJECT
        </Button>
      </div>

      <div className="hairline mb-10" />

      {loading ? (
        <div className="text-center text-muted-foreground tracking-widest py-20">LOADING…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No projects yet. Create your first to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => {
            const tpl = TEMPLATES.find((t) => t.id === p.template_id) ?? TEMPLATES[0];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="spotlight relative border border-border bg-card group"
              >
                <Link to="/project/$id" params={{ id: p.id }} className="block">
                  <div className="aspect-[1.4/1] overflow-hidden bg-muted border-b border-border">
                    <img src={templateToDataUrl(tpl.svg)} alt={tpl.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] tracking-[0.3em] text-gold">{tpl.name.toUpperCase()}</div>
                    <div className="font-heading text-xl tracking-wider mt-1 truncate">{p.name}</div>
                    {p.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                    <div className="text-xs text-muted-foreground mt-3">
                      Updated {new Date(p.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 border border-border rounded p-1.5 hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display tracking-[0.1em] text-2xl">NEW PROJECT</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground">PROJECT NAME</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hackathon 2026" className="mt-2 bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground">DESCRIPTION (optional)</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Internal description" className="mt-2 bg-input border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest text-muted-foreground mb-3 block">CHOOSE TEMPLATE</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTplId(t.id)}
                    className={`relative border-2 transition-all ${tplId === t.id ? "border-primary shadow-[0_0_0_3px_rgba(201,160,76,0.2)]" : "border-border hover:border-muted-foreground"}`}
                  >
                    <img src={templateToDataUrl(t.svg)} alt={t.name} className="w-full aspect-[1.4/1] object-cover" />
                    <div className="p-2 text-[10px] tracking-widest text-left bg-card">{t.name.toUpperCase()}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90 tracking-widest">
              {creating ? "..." : "CREATE →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
