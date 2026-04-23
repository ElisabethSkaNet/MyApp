import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Lightbulb } from "lucide-react"

const CATEGORIES = ["Mat & drikke", "Sport", "Kultur", "Tur", "Spill", "Annet"]

export default function NewSuggestionDialog({ open, onOpenChange }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", suggested_by: "" })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = "Tittel er påkrevd"
    if (!form.description.trim()) e.description = "Beskrivelse er påkrevd"
    if (!form.category) e.category = "Velg en kategori"
    if (!form.suggested_by.trim()) e.suggested_by = "Navn er påkrevd"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { error } = await supabase.from("activity_suggestions").insert([{
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      suggested_by: form.suggested_by.trim(),
    }])
    setLoading(false)
    if (error) {
      toast.error("Noe gikk galt. Prøv igjen.")
      return
    }
    toast.success("Forslag sendt inn!")
    setForm({ title: "", description: "", category: "", suggested_by: "" })
    setErrors({})
    onOpenChange(false)
  }

  function handleClose() {
    setForm({ title: "", description: "", category: "", suggested_by: "" })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Foreslå en aktivitet
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              placeholder="F.eks. Bowling på Åsane"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              placeholder="Hva, hvorfor, og gjerne når/hvor..."
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Ditt navn</Label>
            <Input
              id="name"
              placeholder="Ola Nordmann"
              value={form.suggested_by}
              onChange={e => setForm(f => ({ ...f, suggested_by: e.target.value }))}
            />
            {errors.suggested_by && <p className="text-xs text-destructive">{errors.suggested_by}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Avbryt</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sender inn..." : "Send inn forslag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
