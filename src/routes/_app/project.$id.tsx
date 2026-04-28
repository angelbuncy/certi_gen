import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES, templateToDataUrl, CANVAS_W, CANVAS_H, FONT_OPTIONS } from "@/lib/templates";
import { renderCertificatePdf, sanitizeFilename, type FieldDef } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { Plus, Trash2, Upload, Download, Mail, ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/_app/project/$id")({
  component: ProjectEditor,
});

function ProjectEditor() {
  const { id } = useParams({ from: "/_app/project/$id" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("participation");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [previewIdx, setPreviewIdx] = useState(0);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [busy, setBusy] = useState<string>("");
  const stageRef = useRef<HTMLDivElement>(null);

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0], [templateId]);
  const currentRow = rows[previewIdx] ?? {};
  const selected = fields.find((f) => f.id === selectedField) ?? null;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Project not found"); navigate({ to: "/dashboard" }); return; }
      setName(data.name);
      setTemplateId(data.template_id);
      setFields((data.fields as FieldDef[] | null) ?? []);
      const last = data.last_data as { rows: Record<string, string>[]; columns: string[]; emailColumn?: string } | null;
      if (last) { setRows(last.rows ?? []); setColumns(last.columns ?? []); setEmailColumn(last.emailColumn ?? ""); }
      setLoading(false);
    })();
  }, [id, navigate]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("projects").update({
      name, template_id: templateId, fields,
      last_data: rows.length ? { rows, columns, emailColumn } : null,
    }).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!json.length) return toast.error("File is empty");
      const cols = Object.keys(json[0]);
      const stringRows = json.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")])));
      setColumns(cols); setRows(stringRows); setPreviewIdx(0);
      const guessEmail = cols.find((c) => /e[\-_ ]?mail/i.test(c)) ?? "";
      setEmailColumn(guessEmail);
      // auto-create a "Name" field if none exist
      if (!fields.length && cols.length) {
        const nameCol = cols.find((c) => /name/i.test(c)) ?? cols[0];
        addField(nameCol);
      }
      toast.success(`${stringRows.length} rows loaded`);
    } catch (e) {
      toast.error("Could not read file");
    }
  };

  const addField = (key?: string) => {
    const k = key ?? columns[0] ?? "Name";
    const f: FieldDef = {
      id: crypto.randomUUID(), key: k,
      x: 0.15, y: 0.55, width: 0.7, height: 0.08,
      fontSize: 64, fontFamily: "'Saira Stencil One', sans-serif",
      color: "#1a1a1a", bold: false, align: "center",
    };
    setFields((p) => [...p, f]); setSelectedField(f.id);
  };

  const updateField = (id: string, patch: Partial<FieldDef>) =>
    setFields((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeField = (id: string) => {
    setFields((p) => p.filter((f) => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  // Drag + resize via pointer events on the stage (normalized coords)
  const startDrag = (e: React.PointerEvent, fid: string, mode: "move" | "resize") => {
    e.stopPropagation(); e.preventDefault();
    const stage = stageRef.current!; stage.setPointerCapture(e.pointerId);
    const rect = stage.getBoundingClientRect();
    const start = fields.find((f) => f.id === fid)!;
    const startX = e.clientX, startY = e.clientY;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      if (mode === "move") {
        updateField(fid, {
          x: Math.max(0, Math.min(1 - start.width, start.x + dx)),
          y: Math.max(0, Math.min(1 - start.height, start.y + dy)),
        });
      } else {
        updateField(fid, {
          width: Math.max(0.05, Math.min(1 - start.x, start.width + dx)),
          height: Math.max(0.03, Math.min(1 - start.y, start.height + dy)),
        });
      }
    };
    const up = () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
  };

  const generateAll = async (): Promise<{ name: string; pdf: Uint8Array; row: Record<string, string> }[]> => {
    const results: { name: string; pdf: Uint8Array; row: Record<string, string> }[] = [];
    for (let i = 0; i < rows.length; i++) {
      setBusy(`Generating ${i + 1} / ${rows.length}…`);
      const r = rows[i];
      const filenameBase = sanitizeFilename(r["Name"] ?? r[columns[0]] ?? `cert-${i + 1}`);
      const pdf = await renderCertificatePdf(template, fields, r);
      results.push({ name: `${filenameBase}.pdf`, pdf, row: r });
    }
    setBusy("");
    return results;
  };

  const downloadZip = async () => {
    if (!rows.length) return toast.error("Upload data first");
    if (!fields.length) return toast.error("Add at least one field");
    const items = await generateAll();
    const zip = new JSZip();
    items.forEach((it) => zip.file(it.name, it.pdf));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${sanitizeFilename(name)}.zip`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${items.length} certificates`);
  };

  const downloadOne = async () => {
    if (!rows.length) return toast.error("Upload data first");
    const r = rows[previewIdx];
    const pdf = await renderCertificatePdf(template, fields, r);
    const blob = new Blob([pdf as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${sanitizeFilename(r["Name"] ?? "certificate")}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmails = async () => {
    if (!emailColumn) return toast.error("Pick which column has the email");
    if (!rows.length) return toast.error("Upload data first");
    const items = await generateAll();
    setBusy("Sending emails…");
    const payload = items.map((it, i) => ({
      to: rows[i][emailColumn],
      name: rows[i]["Name"] ?? rows[i][columns[0]] ?? "",
      filename: it.name,
      pdfBase64: btoa(String.fromCharCode(...it.pdf)),
    })).filter((x) => x.to);
    if (!payload.length) { setBusy(""); return toast.error("No valid email addresses"); }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/send-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ projectName: name, items: payload }),
      });
      const json = await res.json();
      setBusy("");
      if (!res.ok) return toast.error(json.error ?? "Send failed");
      toast.success(`Sent ${json.sent} of ${payload.length}`);
    } catch (e) {
      setBusy("");
      toast.error("Network error");
    }
  };

  if (loading) return <div className="grid place-items-center py-32 font-display tracking-[0.4em] text-gold animate-pulse">LOADING…</div>;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })} className="tracking-widest">
            <ArrowLeft className="h-4 w-4 mr-1" /> BACK
          </Button>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border font-heading text-lg tracking-widest w-72" />
        </div>
        <div className="flex items-center gap-2">
          {busy && <span className="text-xs tracking-widest text-gold animate-pulse mr-3">{busy}</span>}
          <Button onClick={save} disabled={saving} variant="outline" className="tracking-widest"><Save className="h-4 w-4 mr-1.5" />{saving ? "..." : "SAVE"}</Button>
          <Button onClick={downloadOne} variant="outline" className="tracking-widest"><Download className="h-4 w-4 mr-1.5" />ONE PDF</Button>
          <Button onClick={downloadZip} className="bg-primary text-primary-foreground hover:bg-primary/90 tracking-widest"><Download className="h-4 w-4 mr-1.5" />ZIP ALL</Button>
          <Button onClick={sendEmails} className="bg-primary text-primary-foreground hover:bg-primary/90 tracking-widest"><Mail className="h-4 w-4 mr-1.5" />MAIL ALL</Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: template + data */}
        <aside className="col-span-3 space-y-6">
          <div className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] text-gold mb-3">TEMPLATE</div>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] text-gold mb-3">DATA (CSV / XLSX)</div>
            <label className="block">
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="border border-dashed border-border p-4 text-center cursor-pointer hover:border-gold transition-colors">
                <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className="text-xs tracking-widest text-muted-foreground">CLICK TO UPLOAD</div>
              </div>
            </label>
            {rows.length > 0 && (
              <>
                <div className="mt-3 text-xs text-muted-foreground">{rows.length} rows · {columns.length} columns</div>
                <div className="mt-3">
                  <Label className="text-[10px] tracking-widest text-muted-foreground">EMAIL COLUMN</Label>
                  <Select value={emailColumn} onValueChange={setEmailColumn}>
                    <SelectTrigger className="bg-input border-border mt-1"><SelectValue placeholder="Pick column…" /></SelectTrigger>
                    <SelectContent>{columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Label className="text-[10px] tracking-widest text-muted-foreground">PREVIEW</Label>
                  <Input type="number" min={1} max={rows.length} value={previewIdx + 1}
                    onChange={(e) => setPreviewIdx(Math.max(0, Math.min(rows.length - 1, +e.target.value - 1)))}
                    className="bg-input border-border h-8 w-20" />
                  <span className="text-xs text-muted-foreground">of {rows.length}</span>
                </div>
              </>
            )}
          </div>

          <div className="border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.3em] text-gold">FIELDS</div>
              <Button onClick={() => addField()} size="sm" variant="ghost" className="h-7 px-2"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {fields.length === 0 ? (
              <div className="text-xs text-muted-foreground">No fields yet. Upload data, then add fields.</div>
            ) : (
              <div className="space-y-1">
                {fields.map((f) => (
                  <div key={f.id} onClick={() => setSelectedField(f.id)}
                    className={`flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs tracking-widest border ${selectedField === f.id ? "border-gold bg-secondary" : "border-transparent hover:border-border"}`}>
                    <span>{f.key}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center: stage */}
        <section className="col-span-6">
          <div ref={stageRef} onClick={() => setSelectedField(null)}
            className="relative bg-white border border-border shadow-2xl select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
            <img src={templateToDataUrl(template.svg)} alt="" className="absolute inset-0 w-full h-full pointer-events-none" />
            {fields.map((f) => {
              const text = currentRow[f.key] ?? `{${f.key}}`;
              const isSel = f.id === selectedField;
              return (
                <div key={f.id}
                  onPointerDown={(e) => { setSelectedField(f.id); startDrag(e, f.id, "move"); }}
                  className={`absolute cursor-move ${isSel ? "outline outline-2 outline-primary" : "outline-dashed outline-1 outline-muted-foreground/40 hover:outline-primary/60"}`}
                  style={{
                    left: `${f.x * 100}%`, top: `${f.y * 100}%`,
                    width: `${f.width * 100}%`, height: `${f.height * 100}%`,
                    display: "flex", alignItems: "center",
                    justifyContent: f.align === "center" ? "center" : f.align === "right" ? "flex-end" : "flex-start",
                  }}>
                  <span style={{
                    fontFamily: f.fontFamily, color: f.color, fontWeight: f.bold ? 700 : 400,
                    fontSize: `calc(${f.fontSize / CANVAS_H} * 100cqh)`, whiteSpace: "nowrap", lineHeight: 1,
                  }}>{text}</span>
                  {isSel && (
                    <div onPointerDown={(e) => startDrag(e, f.id, "resize")}
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary cursor-se-resize" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground tracking-wider text-center">
            DRAG TO MOVE · DRAG GOLD CORNER TO RESIZE · COORDINATES NORMALIZED 0–1 (CANVAS {CANVAS_W}×{CANVAS_H})
          </p>
        </section>

        {/* Right: field properties */}
        <aside className="col-span-3 space-y-4">
          <div className="border border-border bg-card p-4 min-h-[400px]">
            <div className="text-[10px] tracking-[0.3em] text-gold mb-4">PROPERTIES</div>
            {!selected ? (
              <p className="text-xs text-muted-foreground">Select a field to edit its style.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] tracking-widest text-muted-foreground">DATA COLUMN</Label>
                  <Select value={selected.key} onValueChange={(v) => updateField(selected.id, { key: v })}>
                    <SelectTrigger className="bg-input border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {columns.length === 0 && <SelectItem value={selected.key}>{selected.key}</SelectItem>}
                      {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] tracking-widest text-muted-foreground">FONT FAMILY</Label>
                  <Select value={selected.fontFamily} onValueChange={(v) => updateField(selected.id, { fontFamily: v })}>
                    <SelectTrigger className="bg-input border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] tracking-widest text-muted-foreground">SIZE (px)</Label>
                    <Input type="number" min={8} max={200} value={selected.fontSize}
                      onChange={(e) => updateField(selected.id, { fontSize: +e.target.value })}
                      className="bg-input border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px] tracking-widest text-muted-foreground">COLOR</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={selected.color} onChange={(e) => updateField(selected.id, { color: e.target.value })} className="h-10 w-14 bg-input border border-border" />
                      <Input value={selected.color} onChange={(e) => updateField(selected.id, { color: e.target.value })} className="bg-input border-border" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] tracking-widest text-muted-foreground">ALIGN</Label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button key={a} onClick={() => updateField(selected.id, { align: a })}
                        className={`text-xs tracking-widest py-2 border ${selected.align === a ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {a.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => updateField(selected.id, { bold: !selected.bold })}
                  className={`w-full text-xs tracking-widest py-2 border ${selected.bold ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  BOLD {selected.bold ? "ON" : "OFF"}
                </button>
                <div className="hairline" />
                <div className="text-[10px] text-muted-foreground tracking-widest">
                  X {(selected.x * 100).toFixed(1)}% · Y {(selected.y * 100).toFixed(1)}%<br />
                  W {(selected.width * 100).toFixed(1)}% · H {(selected.height * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
