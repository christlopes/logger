"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface EntryType {
  id: string;
  name: string;
}

interface AddTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeAdded: (type: EntryType) => void;
}

export function AddTypeDialog({
  open,
  onOpenChange,
  onTypeAdded,
}: AddTypeDialogProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Type name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        const newType = await response.json();
        onTypeAdded(newType);
        setName("");
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create type");
      }
    } catch (error) {
      console.error("Error creating type:", error);
      setError("Failed to create type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Type</DialogTitle>
          <DialogDescription>
            Create a new entry type (e.g., Meeting, Task, Note)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="type-name" className="text-sm font-medium">
              Type Name
            </label>
            <Input
              id="type-name"
              placeholder="Enter type name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
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
              {isSubmitting ? "Adding..." : "Add Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

