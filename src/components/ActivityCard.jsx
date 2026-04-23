import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { toast } from "sonner"
import { supabase } from "@/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CommentSheet from "@/components/CommentSheet"
import { ThumbsUp, MessageCircle, CheckCircle, Archive, Star } from "lucide-react"

const STATUS_CONFIG = {
  foreslått: { label: "Foreslått", variant: "secondary", icon: null },
  valgt:     { label: "Valgt av Soskom", variant: "success",    icon: CheckCircle },
  arkivert:  { label: "Arkivert",        variant: "muted",      icon: Archive },
}

const STORAGE_KEY = "soskom_votes"

function getVotedIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

function markVoted(id) {
  const ids = getVotedIds()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]))
}

export default function ActivityCard({ suggestion, onCommentCountUpdate }) {
  const [votes, setVotes] = useState(suggestion.votes || 0)
  const [hasVoted, setHasVoted] = useState(() => getVotedIds().includes(suggestion.id))
  const [voting, setVoting] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(suggestion.comment_count || 0)

  const status = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.foreslått
  const StatusIcon = status.icon

  async function handleVote() {
    if (hasVoted || voting) return
    setVoting(true)
    const newVotes = votes + 1
    const { error } = await supabase
      .from("activity_suggestions")
      .update({ votes: newVotes })
      .eq("id", suggestion.id)
    setVoting(false)
    if (error) { toast.error("Kunne ikke registrere stemme."); return }
    setVotes(newVotes)
    setHasVoted(true)
    markVoted(suggestion.id)
  }

  return (
    <>
      <Card className={cn(
        "transition-shadow hover:shadow-md",
        suggestion.status === "arkivert" && "opacity-70"
      )}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
              <Badge variant={status.variant} className="text-xs flex items-center gap-1">
                {StatusIcon && <StatusIcon className="h-3 w-3" />}
                {status.label}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: nb })}
            </span>
          </div>

          <h3 className="font-semibold text-base mb-1 leading-snug">{suggestion.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{suggestion.description}</p>

          {suggestion.soskom_note && (
            <Alert variant="success" className="mb-3">
              <Star className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Fra Soskom: </span>
                {suggestion.soskom_note}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Foreslått av <span className="font-medium text-foreground">{suggestion.suggested_by}</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2"
                onClick={() => setCommentOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{commentCount}</span>
              </Button>
              <Button
                variant={hasVoted ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-3 transition-all",
                  hasVoted && "bg-violet-600 hover:bg-violet-600 border-violet-600 text-white cursor-default"
                )}
                onClick={handleVote}
                disabled={hasVoted || voting}
                title={hasVoted ? "Du har allerede stemt" : "Stem på dette forslaget"}
              >
                <ThumbsUp className={cn("h-4 w-4", hasVoted && "fill-white")} />
                <span className="text-xs font-medium">{votes}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CommentSheet
        suggestion={suggestion}
        open={commentOpen}
        onOpenChange={(v) => {
          setCommentOpen(v)
        }}
      />
    </>
  )
}
