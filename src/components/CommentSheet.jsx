import { useState, useEffect } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { supabase } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { MessageCircle, Send } from "lucide-react"

export default function CommentSheet({ suggestion, open, onOpenChange }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ author_name: "", comment_text: "" })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !suggestion) return
    fetchComments()

    const channel = supabase
      .channel(`comments-${suggestion.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "suggestion_comments",
        filter: `suggestion_id=eq.${suggestion.id}`,
      }, () => fetchComments())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [open, suggestion?.id])

  async function fetchComments() {
    if (!suggestion) return
    setLoading(true)
    const { data } = await supabase
      .from("suggestion_comments")
      .select("*")
      .eq("suggestion_id", suggestion.id)
      .order("created_at", { ascending: true })
    setComments(data || [])
    setLoading(false)
  }

  function validate() {
    const e = {}
    if (!form.author_name.trim()) e.author_name = "Navn er påkrevd"
    if (!form.comment_text.trim()) e.comment_text = "Kommentar er påkrevd"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const { error } = await supabase.from("suggestion_comments").insert([{
      suggestion_id: suggestion.id,
      author_name: form.author_name.trim(),
      comment_text: form.comment_text.trim(),
    }])
    setSubmitting(false)
    if (error) { toast.error("Kunne ikke sende kommentar."); return }
    setForm(f => ({ ...f, comment_text: "" }))
    setErrors({})
  }

  if (!suggestion) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <MessageCircle className="h-5 w-5 shrink-0" />
            <span className="truncate">{suggestion.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Ingen kommentarer ennå. Vær den første!
            </p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: nb })}
                  </span>
                </div>
                <p className="text-sm">{c.comment_text}</p>
              </div>
            ))
          )}
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="comment-name">Ditt navn</Label>
            <Input
              id="comment-name"
              placeholder="Ola Nordmann"
              value={form.author_name}
              onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
            />
            {errors.author_name && <p className="text-xs text-destructive">{errors.author_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment-text">Kommentar</Label>
            <Textarea
              id="comment-text"
              placeholder="Skriv din kommentar her..."
              rows={2}
              value={form.comment_text}
              onChange={e => setForm(f => ({ ...f, comment_text: e.target.value }))}
            />
            {errors.comment_text && <p className="text-xs text-destructive">{errors.comment_text}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? "Sender..." : "Send kommentar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
