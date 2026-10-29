"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, ExternalLink, Eye, FileText, FolderKanban, Globe2, LogOut, Plus, Save, Trash2, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ContentEditor from "./content-editor";
import type { SiteContent } from "../lib/site-content";

type CaseStudy = { problem: string; approach: string; highlights: string[]; outcome: string };
type Project = { id: string; title: string; description: string; tech: string[]; thumbnail: string; screenshot: string; github?: string; live?: string; published: boolean; sortOrder: number; caseStudy: CaseStudy };
type Analytics = { totals: { page_views: number; visitors: number; sessions: number }; series: { date: string; visitors: number; page_views: number }[]; pages: { page_path: string; views: number }[]; referrers: { referrer: string; visits: number }[] };

const api = process.env.NEXT_PUBLIC_API_URL;
const emptyProject: Project = { id: "", title: "", description: "", tech: [], thumbnail: "", screenshot: "", github: "", live: "", published: false, sortOrder: 0, caseStudy: { problem: "", approach: "", highlights: [], outcome: "" } };

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-sm text-[#a3a3a3]">{label}<input required={required} value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-[#262626] bg-black px-3.5 py-3 text-white outline-none focus:border-white" /></label>;
}

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "projects" | "content">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [techInput, setTechInput] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${api}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers } });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed");
    return response.status === 204 ? null : response.json();
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [summary, allProjects, site] = await Promise.all([request("/admin/analytics?days=30"), request("/admin/projects"), request("/admin/content")]);
      setAnalytics(summary);
      setProjects(allProjects);
      setContent(site.content);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load dashboard"); }
  }, [request, token]);

  useEffect(() => { const saved = window.sessionStorage.getItem("kj-admin-token"); if (saved) setToken(saved); }, []);
  useEffect(() => { if (token) void load(); }, [token, load]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Sign-in failed");
      window.sessionStorage.setItem("kj-admin-token", body.token); setToken(body.token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed"); }
    finally { setBusy(false); }
  }

  function logout() { window.sessionStorage.removeItem("kj-admin-token"); setToken(""); setAnalytics(null); setProjects([]); setContent(null); }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true);
    try { await request(`/admin/projects/${encodeURIComponent(editing.id)}`, { method: "PUT", body: JSON.stringify({ ...editing, tech: techInput.split(",").map(value => value.trim()).filter(Boolean) }) }); setEditing(null); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save project"); }
    finally { setBusy(false); }
  }

  async function saveContent() {
    if (!content) return;
    setSavingContent(true); setError("");
    try { await request("/admin/content", { method: "PUT", body: JSON.stringify(content) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save site content"); }
    finally { setSavingContent(false); }
  }

  async function removeProject(id: string) {
    if (!window.confirm(`Delete ${id}?`)) return;
    try { await request(`/admin/projects/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete project"); }
  }

  if (!token) return <main className="grid min-h-screen place-items-center px-5"><form onSubmit={login} className="w-full max-w-md rounded-3xl border border-[#262626] bg-[#111] p-8 shadow-2xl">
    <div className="mb-8"><p className="text-sm font-medium tracking-wide text-[#a3a3a3]">KJTech</p><h1 className="mt-1 text-xl font-semibold">Portfolio dashboard</h1></div>
    <label className="mb-4 block text-sm text-[#a3a3a3]">Email<input className="mt-2 w-full rounded-xl border border-[#262626] bg-black px-4 py-3 outline-none focus:border-white" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required /></label>
    <label className="mb-6 block text-sm text-[#a3a3a3]">Password<input className="mt-2 w-full rounded-xl border border-[#262626] bg-black px-4 py-3 outline-none focus:border-white" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
    {error && <p className="mb-4 text-sm text-[#a3a3a3]">{error}</p>}<button disabled={busy || !api} className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50">{!api ? "Set API URL to continue" : busy ? "Signing in…" : "Sign in"}</button>
  </form></main>;

  const stats = analytics ? [[Eye, "Page views", analytics.totals.page_views], [Users, "Unique visitors", analytics.totals.visitors], [Globe2, "Sessions", analytics.totals.sessions]] as const : [];

  return <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
    <aside className="flex flex-col border-b border-[#262626] bg-[#000000] p-5 md:min-h-screen md:border-b-0 md:border-r">
      <a href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || "#"} target="_blank" rel="noreferrer" className="mb-10 flex items-center gap-3"><span><b className="block text-lg font-semibold">KJTech</b><small className="text-[#737373]">Portfolio admin</small></span><ExternalLink className="ml-auto text-[#737373]" size={16}/></a>
      <nav className="flex gap-2 md:flex-col">{([["overview", BarChart3, "Overview"], ["projects", FolderKanban, "Projects"], ["content", FileText, "Site content"]] as const).map(([key, Icon, label]) => <button key={key} onClick={() => { setTab(key); setEditing(null); }} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${tab === key ? "bg-[#262626] text-white" : "text-[#a3a3a3] hover:bg-[#171717] hover:text-white"}`}><Icon size={18}/>{label}</button>)}</nav>
      <button onClick={logout} className="mt-auto hidden items-center gap-3 px-4 py-3 text-sm text-[#737373] hover:text-white md:flex"><LogOut size={17}/>Sign out</button>
    </aside>

    <main className="min-w-0 p-5 sm:p-8 lg:p-10">
      <header className="mb-8 flex items-center justify-between"><div><p className="mb-1 text-xs font-medium uppercase tracking-[.22em] text-white">Workspace</p><h1 className="text-2xl font-semibold sm:text-3xl">{tab === "overview" ? "Overview" : tab === "projects" ? "Projects" : "Site content"}</h1></div><div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-[#262626] px-4 py-2.5 text-sm text-[#a3a3a3] hover:bg-[#171717]">Refresh</button>{tab === "projects" && <button onClick={() => { setEditing({ ...emptyProject, caseStudy: { ...emptyProject.caseStudy } }); setTechInput(""); }} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"><Plus size={17}/>Add project</button>}</div></header>
      {error && <div className="mb-5 rounded-xl border border-[#404040] bg-[#171717] px-4 py-3 text-sm text-[#fafafa]">{error}</div>}

      {tab === "overview" && <>{!analytics ? <p className="text-[#737373]">Loading analytics…</p> : <>
        <div className="grid gap-4 sm:grid-cols-3">{stats.map(([Icon, label, value]) => <article key={label} className="rounded-2xl border border-[#262626] bg-[#111] p-5"><div className="mb-5 flex items-center justify-between text-sm text-[#a3a3a3]"><span>{label}</span><span className="grid size-9 place-items-center rounded-xl bg-white/10 text-white"><Icon size={18}/></span></div><strong className="text-3xl">{value.toLocaleString()}</strong><p className="mt-2 text-xs text-[#737373]">Last 30 days</p></article>)}</div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)]">
          <section className="rounded-xl border border-[#262626] bg-[#111] p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Visitor activity</h2><p className="mt-1 text-xs text-[#737373]">Daily unique visitors · last 30 days</p></div><span className="text-xs text-[#737373]">Visitors</span></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analytics.series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#262626" vertical={false}/><XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill: "#737373", fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #262626", borderRadius: 8, color: "#fafafa", fontSize: 12 }} labelStyle={{ color: "#a3a3a3" }}/><Area type="monotone" dataKey="visitors" stroke="#fafafa" strokeWidth={2} fill="#fafafa" fillOpacity={0.08} activeDot={{ r: 4, fill: "#fafafa" }}/></AreaChart></ResponsiveContainer></div></section>
          <section className="rounded-xl border border-[#262626] bg-[#111] p-5"><h2 className="mb-5 text-sm font-semibold">Top pages</h2><div className="space-y-3">{analytics.pages.map((page, index) => <div key={page.page_path} className="flex items-center gap-3 text-sm"><span className="w-5 text-xs text-[#737373]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-[#a3a3a3]">{page.page_path}</span><span className="text-[#fafafa]">{page.views}</span></div>)}</div><h3 className="mb-3 mt-8 text-xs font-medium uppercase tracking-wide text-[#737373]">Referrers</h3><div className="space-y-3">{analytics.referrers.map(item => <div key={item.referrer} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-[#a3a3a3]">{item.referrer}</span><span className="text-[#fafafa]">{item.visits}</span></div>)}</div></section>
        </div>
        <section className="mt-5 rounded-2xl border border-[#262626] bg-[#111] p-5"><h2 className="mb-4 font-semibold">Content at a glance</h2><p className="text-sm text-[#a3a3a3]">{projects.length} projects · {projects.filter(project => project.published).length} published</p></section>
      </>}</>}

      {tab === "content" && (content ? <ContentEditor content={content} onChange={setContent} onSave={() => void saveContent()} saving={savingContent}/> : <p className="text-sm text-[#737373]">Loading site content…</p>)}

      {tab === "projects" && (editing ? <form onSubmit={saveProject} className="max-w-4xl rounded-2xl border border-[#262626] bg-[#111] p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold">{editing.title ? "Edit project" : "New project"}</h2><button type="button" onClick={() => setEditing(null)} className="text-sm text-[#737373]">Cancel</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project slug" value={editing.id} required onChange={id => setEditing({ ...editing, id: id.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}/>
          <Field label="Title" value={editing.title} required onChange={title => setEditing({ ...editing, title })}/>
          <Field label="Thumbnail URL or portfolio path" value={editing.thumbnail} required onChange={thumbnail => setEditing({ ...editing, thumbnail })}/>
          <Field label="Screenshot URL or portfolio path" value={editing.screenshot} required onChange={screenshot => setEditing({ ...editing, screenshot })}/>
          <Field label="GitHub URL" value={editing.github || ""} onChange={github => setEditing({ ...editing, github })}/>
          <Field label="Live URL" value={editing.live || ""} onChange={live => setEditing({ ...editing, live })}/>
          <label className="text-sm text-[#a3a3a3] sm:col-span-2">Description<textarea required value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-[#262626] bg-black p-3.5 text-white outline-none focus:border-white"/></label>
          <label className="text-sm text-[#a3a3a3] sm:col-span-2">Technologies, comma separated<input value={techInput} onChange={event => setTechInput(event.target.value)} className="mt-2 w-full rounded-xl border border-[#262626] bg-black px-3.5 py-3 text-white outline-none focus:border-white"/></label>
          {([["problem", "Problem"], ["approach", "Approach"], ["outcome", "Outcome"]] as const).map(([key, label]) => <label key={key} className="text-sm text-[#a3a3a3] sm:col-span-2">Case study · {label}<textarea value={editing.caseStudy[key]} onChange={event => setEditing({ ...editing, caseStudy: { ...editing.caseStudy, [key]: event.target.value } })} className="mt-2 min-h-20 w-full rounded-xl border border-[#262626] bg-black p-3.5 text-white outline-none focus:border-white"/></label>)}
          <label className="text-sm text-[#a3a3a3] sm:col-span-2">Highlights, one per line<textarea value={editing.caseStudy.highlights.join("\n")} onChange={event => setEditing({ ...editing, caseStudy: { ...editing.caseStudy, highlights: event.target.value.split("\n") } })} className="mt-2 min-h-24 w-full rounded-xl border border-[#262626] bg-black p-3.5 text-white outline-none focus:border-white"/></label>
          <Field label="Display order" value={String(editing.sortOrder)} onChange={value => setEditing({ ...editing, sortOrder: Number(value) || 0 })}/>
          <label className="flex items-center gap-3 text-sm text-[#a3a3a3]"><input type="checkbox" checked={editing.published} onChange={event => setEditing({ ...editing, published: event.target.checked })} className="accent-white"/>Published on portfolio</label>
        </div>
        <button disabled={busy} className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"><Save size={16}/>{busy ? "Saving…" : "Save project"}</button>
      </form> : <section className="overflow-hidden rounded-2xl border border-[#262626] bg-[#111]"><div className="flex items-center justify-between border-b border-[#262626] px-5 py-4"><h2 className="font-semibold">All projects</h2><span className="text-sm text-[#737373]">{projects.length} total</span></div>{projects.length ? <div className="divide-y divide-[#262626]">{projects.map(project => <div key={project.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate font-medium">{project.title}</p><p className="mt-1 truncate text-xs text-[#737373]">{project.tech.join(" · ")}</p></div><span className={`hidden rounded-full px-2.5 py-1 text-xs sm:block ${project.published ? "bg-white/10 text-white" : "bg-[#171717] text-[#737373]"}`}>{project.published ? "Published" : "Draft"}</span><button onClick={() => { setEditing({ ...project, caseStudy: { ...project.caseStudy } }); setTechInput(project.tech.join(", ")); }} className="rounded-lg px-3 py-2 text-sm text-[#a3a3a3] hover:bg-[#262626]">Edit</button><button onClick={() => void removeProject(project.id)} aria-label={`Delete ${project.title}`} className="rounded-lg p-2 text-[#737373] hover:bg-[#262626] hover:text-[#fafafa]"><Trash2 size={16}/></button></div>)}</div> : <div className="p-12 text-center text-sm text-[#737373]"><FolderKanban className="mx-auto mb-3"/><p>No projects yet. Add your first project.</p></div>}</section>)}

      <footer className="mt-10 flex items-center justify-between border-t border-[#262626] pt-5 text-xs text-[#737373]"><span>Portfolio control panel</span><a className="flex items-center gap-1 hover:text-[#a3a3a3]" target="_blank" rel="noreferrer" href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || "#"}>View portfolio <ArrowUpRight size={13}/></a></footer>
    </main>
  </div>;
}
