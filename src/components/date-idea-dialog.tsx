"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateIdea {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  review: string | null;
}

interface DateIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingIdea?: DateIdea | null;
}

export function DateIdeaDialog({
  open,
  onOpenChange,
  onSaved,
  editingIdea,
}: DateIdeaDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingIdea) {
        setName(editingIdea.name);
        setDescription(editingIdea.description || "");
        setReview(editingIdea.review || "");
      } else {
        setName("");
        setDescription("");
        setReview("");
      }
    }
  }, [open, editingIdea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a name");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingIdea;
      const url = isEditing ? `/api/date-ideas/${editingIdea.id}` : "/api/date-ideas";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
      };
      if (isEditing && editingIdea.completed) {
        body.review = review.trim() || null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setName("");
        setDescription("");
        setReview("");
        onOpenChange(false);
        onSaved?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save date idea");
      }
    } catch {
      alert("Failed to save date idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDescription("");
      setReview("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingIdea ? "Edit Date Idea" : "New Date Idea"}</DialogTitle>
          <DialogDescription>
            {editingIdea ? "Update this idea" : "Add a new date idea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              placeholder="Date idea..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {editingIdea?.completed && (
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm font-medium">
                Review
              </label>
              <Textarea
                id="review"
                placeholder="How did it go?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
