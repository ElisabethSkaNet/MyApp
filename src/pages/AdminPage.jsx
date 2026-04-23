import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { toast } from "sonner"
import { supabase } from "@/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import CommentSheet from "@/components/CommentSheet"
import {
  Shield, Trash2, CheckCircle, Archive, Inbox,
  MessageCircle, ThumbsUp, ChevronDown,
} from "lucide-react"

const STATUS_OPTIONS = [
  { value: "foreslått", label: "Foreslått", icon: Inbox,       color: "text-zinc-500" },
  { value: "valgt",     label: "Valgt",     icon: CheckCircle, color: "text-emerald-600" },
  { value: "arkivert",  label: "Arkivert",  icon: Archive,     color: "text-zinc-400" },
]

const STATUS_BADGE = {
  foreslått: "secondary",
  valgt:     "success",
  arkivert:  "muted",
}

function StatusDialog({ open, onOpenChange, suggestion, targetStatus, onConfirm }) {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) setNote("") }, [open])

  async function handleConfirm() {
    if (!note.trim()) { toast.error("Skriv en begrunnelse"); return }
    setLoading(true)
    await onConfirm(note.trim())
    setLoading(false)
    onOpenChange(false)
  }

  const label = targetStatus === "valgt" ? "Valgt av Soskom" : "Arkivert"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marker som «{label}»</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Skriv en begrunnelse som vises til alle brukere:
        </p>
        <Textarea
          rows={3}
          placeholder="F.eks. «Vi går for dette til sommerfesten!»"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Lagrer..." : "Bekreft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AdminCard({ suggestion, onUpdate, onDelete }) {
  const [statusDialog, setStatusDialog] = useState({ open: false, targetStatus: null })
  const [commentOpen, setCommentOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleStatusChange(targetStatus) {
    if (targetStatus === suggestion.status) return
    if (targetStatus === "foreslått") {
      const { error } = await supabase
        .from("activity_suggestions")
        .update({ status: "foreslått", soskom_note: null, status_changed_at: new Date().toISOString() })
        .eq("id", suggestion.id)
      if (error) { toast.error("Noe gikk galt"); return }
      toast.success("Status oppdatert")
      onUpdate()
      return
    }
    setStatusDialog({ open: true, targetStatus })
  }

  async function handleStatusConfirm(note) {
    const { error } = await supabase
      .from("activity_suggestions")
      .update({
        status: statusDialog.targetStatus,
        soskom_note: note,
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", suggestion.id)
    if (error) { toast.error("Noe gikk galt"); return }
    toast.success("Status oppdatert")
    onUpdate()
  }

  async function handleDelete() {
    if (!window.confirm(`Slett «${suggestion.title}»?`)) return
    setDeleting(true)
    const { error } = await supabase.from("activity_suggestions").delete().eq("id", suggestion.id)
    setDeleting(false)
    if (error) { toast.error("Kunne ikke slette"); return }
    toast.success("Forslag slettet")
    onUpdate()
  }

  const currentOpt = STATUS_OPTIONS.find(o => o.value === suggestion.status) || STATUS_OPTIONS[0]
  const CurrentIcon = currentOpt.icon

  return (
    <>
      <Card className={cn(suggestion.status === "arkivert" && "opacity-60")}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
                <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                <Badge variant={STATUS_BADGE[suggestion.status]} className="text-xs">
                  {currentOpt.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: nb })}
                </span>
              </div>
              <h3 className="font-semibold text-sm leading-snug">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{suggestion.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Av <span className="font-medium text-foreground">{suggestion.suggested_by}</span>
              </p>
              {suggestion.soskom_note && (
                <p className="text-xs mt-1.5 text-emerald-700 bg-emerald-50 rounded px-2 py-1">
                  Begrunnelse: {suggestion.soskom_note}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{suggestion.votes}</span>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={suggestion.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <div className="flex items-center gap-1.5">
                    <CurrentIcon className={cn("h-3.5 w-3.5", currentOpt.color)} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex items-center gap-2">
                        <o.icon className={cn("h-3.5 w-3.5", o.color)} />
                        {o.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => setCommentOpen(true)}>
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs">Kommentarer</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <StatusDialog
        open={statusDialog.open}
        onOpenChange={v => setStatusDialog(s => ({ ...s, open: v }))}
        suggestion={suggestion}
        targetStatus={statusDialog.targetStatus}
        onConfirm={handleStatusConfirm}
      />
      <CommentSheet suggestion={suggestion} open={commentOpen} onOpenChange={setCommentOpen} />
    </>
  )
}

export default function AdminPage() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("alle")

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_suggestions" }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchAll() {
    const { data } = await supabase
      .from("activity_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
    setSuggestions(data || [])
    setLoading(false)
  }

  const filtered = filter === "alle"
    ? suggestions
    : suggestions.filter(s => s.status === filter)

  const counts = {
    alle:      suggestions.length,
    foreslått: suggestions.filter(s => s.status === "foreslått").length,
    valgt:     suggestions.filter(s => s.status === "valgt").length,
    arkivert:  suggestions.filter(s => s.status === "arkivert").length,
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Aktivitetsforslag</h1>
                <Badge className="bg-zinc-800 text-white text-xs flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Soskom-administrasjon</p>
            </div>
          </div>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            Tilbake til appen
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oversikt</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { key: "alle", label: "Alle" },
                { key: "foreslått", label: "Foreslått" },
                { key: "valgt", label: "Valgt" },
                { key: "arkivert", label: "Arkivert" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-lg p-2 text-sm transition-colors",
                    filter === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <div className="text-xl font-bold">{counts[key]}</div>
                  <div className="text-xs opacity-70">{label}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-24" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">
            Ingen forslag i denne kategorien.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
              <AdminCard key={s.id} suggestion={s} onUpdate={fetchAll} onDelete={fetchAll} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
