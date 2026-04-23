import { Lightbulb, ThumbsUp, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StatsBar({ suggestions, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><CardContent className="pt-4"><Skeleton className="h-12" /></CardContent></Card>
        ))}
      </div>
    )
  }

  const totalVotes = suggestions.reduce((sum, s) => sum + (s.votes || 0), 0)
  const chosen = suggestions.filter(s => s.status === "valgt").length

  const stats = [
    { label: "Forslag totalt", value: suggestions.length, icon: Lightbulb, color: "text-blue-600" },
    { label: "Stemmer totalt", value: totalVotes, icon: ThumbsUp, color: "text-violet-600" },
    { label: "Valgt av Soskom", value: chosen, icon: CheckCircle, color: "text-emerald-600" },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
