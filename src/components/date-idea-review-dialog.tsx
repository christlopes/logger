"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateIdeaReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaName: string;
  onSaved?: () => void;
}

export function DateIdeaReviewDialog({
  open,
  onOpenChange,
  ideaId,
  ideaName,
  onSaved,
}: DateIdeaReviewDialogProps) {
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (includeReview: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/date-ideas/${ideaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: true,
          review: includeReview ? review.trim() || null : null,
        }),
      });

      if (response.ok) {
        setReview("");
        onOpenChange(false);
        onSaved?.();
      } else {
        alert("Failed to mark as done");
      }
    } catch {
      alert("Failed to mark as done");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setReview("");
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mark as Done</DialogTitle>
          <DialogDescription>
            How was &quot;{ideaName}&quot;? Write a quick note (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="How did it go?"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleComplete(false)}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={() => handleComplete(true)}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
