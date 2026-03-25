"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, Trash2, Check, Undo2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DateIdeaDialog } from "@/components/date-idea-dialog";
import { DateIdeaReviewDialog } from "@/components/date-idea-review-dialog";

interface DateIdea {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  review: string | null;
  created_at: string;
}

export default function DateIdeasPage() {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<DateIdea | null>(null);
  const [reviewingIdea, setReviewingIdea] = useState<DateIdea | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch("/api/date-ideas");
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      } else {
        setLoadError("Failed to load date ideas.");
      }
    } catch {
      setLoadError("Failed to load date ideas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const activeIdeas = useMemo(() => ideas.filter((i) => !i.completed), [ideas]);
  const completedIdeas = useMemo(() => ideas.filter((i) => i.completed), [ideas]);

  const handleRevert = async (id: string) => {
    try {
      const response = await fetch(`/api/date-ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (response.ok) fetchIdeas();
    } catch {
      alert("Failed to revert");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      const response = await fetch(`/api/date-ideas/${id}`, { method: "DELETE" });
      if (response.ok) fetchIdeas();
      else alert("Failed to delete idea");
    } catch {
      alert("Failed to delete idea");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {loadError && (
          <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
            {loadError}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Date Ideas</h1>
          <Button
            onClick={() => {
              setEditingIdea(null);
              setIsDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + Add Idea
          </Button>
        </div>

        {activeIdeas.length === 0 && completedIdeas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No date ideas yet. Add your first idea to get started!
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {activeIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{idea.name}</div>
                    {idea.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {idea.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setReviewingIdea(idea)}
                      className="h-8 w-8 text-accent hover:text-accent/90 hover:bg-accent/10"
                      title="Mark as done"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingIdea(idea);
                        setIsDialogOpen(true);
                      }}
                      className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                      title="Edit idea"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(idea.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      title="Delete idea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {completedIdeas.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-90" : ""}`}
                  />
                  Show completed dates ({completedIdeas.length})
                </button>

                {showCompleted && (
                  <div className="mt-3 space-y-2 opacity-60">
                    {completedIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className="flex items-center gap-3 rounded-lg border bg-card p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-muted-foreground line-through">
                            {idea.name}
                          </div>
                          {idea.review && (
                            <div className="text-sm text-accent italic mt-1">
                              &quot;{idea.review}&quot;
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Completed {idea.completed_at ? format(new Date(idea.completed_at), "MMM d, yyyy") : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevert(idea.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Move back to ideas"
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DateIdeaDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingIdea(null);
        }}
        onSaved={fetchIdeas}
        editingIdea={editingIdea}
      />

      {reviewingIdea && (
        <DateIdeaReviewDialog
          open={!!reviewingIdea}
          onOpenChange={(open) => {
            if (!open) setReviewingIdea(null);
          }}
          ideaId={reviewingIdea.id}
          ideaName={reviewingIdea.name}
          onSaved={fetchIdeas}
        />
      )}
    </div>
  );
}
