import { useState, useEffect } from "react"
import { supabase } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import StatsBar from "@/components/StatsBar"
import ActivityCard from "@/components/ActivityCard"
import NewSuggestionDialog from "@/components/NewSuggestionDialog"
import { Plus, Inbox, CheckCircle, Archive, PartyPopper } from "lucide-react"

function SuggestionList({ suggestions, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><CardContent className="pt-4"><Skeleton className="h-28" /></CardContent></Card>
        ))}
      </div>
    )
  }
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <PartyPopper className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Ingen forslag her ennå</p>
        <p className="text-sm mt-1">Vær den første til å foreslå noe!</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {suggestions.map(s => <ActivityCard key={s.id} suggestion={s} />)}
    </div>
  )
}

export default function HomePage() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchSuggestions()

    const channel = supabase
      .channel("suggestions-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "activity_suggestions",
      }, () => fetchSuggestions())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchSuggestions() {
    const { data } = await supabase
      .from("activity_suggestions")
      .select("*, suggestion_comments(count)")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false })

    const normalized = (data || []).map(s => ({
      ...s,
      comment_count: s.suggestion_comments?.[0]?.count ?? 0,
    }))
    setSuggestions(normalized)
    setLoading(false)
  }

  const foreslått = suggestions.filter(s => s.status === "foreslått")
  const valgt     = suggestions.filter(s => s.status === "valgt")
  const arkivert  = suggestions.filter(s => s.status === "arkivert")

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Aktivitetsforslag</h1>
            <p className="text-xs text-muted-foreground">Foreslå og stem på aktiviteter for Soskom</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Foreslå aktivitet</span>
            <span className="sm:hidden">Foreslå</span>
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <StatsBar suggestions={suggestions} loading={loading} />

        <Tabs defaultValue="foreslått">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="foreslått" className="flex-1 gap-1.5">
              <Inbox className="h-4 w-4" />
              Foreslått
              {!loading && <span className="text-xs opacity-60">({foreslått.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="valgt" className="flex-1 gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Valgt
              {!loading && <span className="text-xs opacity-60">({valgt.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="arkivert" className="flex-1 gap-1.5">
              <Archive className="h-4 w-4" />
              Arkivert
              {!loading && <span className="text-xs opacity-60">({arkivert.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="foreslått">
            <SuggestionList suggestions={foreslått} loading={loading} />
          </TabsContent>
          <TabsContent value="valgt">
            <SuggestionList suggestions={valgt} loading={loading} />
          </TabsContent>
          <TabsContent value="arkivert">
            <SuggestionList suggestions={arkivert} loading={loading} />
          </TabsContent>
        </Tabs>
      </main>

      <NewSuggestionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
