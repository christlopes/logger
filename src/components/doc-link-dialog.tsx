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

interface Tag {
  id: string;
  name: string;
}

interface DocLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  tags: Tag[];
}

interface DocLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  editingLink?: DocLink | null;
}

export function DocLinkDialog({
  open,
  onOpenChange,
  onSaved,
  editingLink,
}: DocLinkDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingLink) {
        setTitle(editingLink.title);
        setUrl(editingLink.url);
        setDescription(editingLink.description || "");
        setTagsInput(editingLink.tags.map((t) => t.name).join(", "));
      } else {
        setTitle("");
        setUrl("");
        setDescription("");
        setTagsInput("");
      }
    }
  }, [open, editingLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingLink;
      const endpoint = isEditing ? `/api/doc-links/${editingLink.id}` : "/api/doc-links";
      const method = isEditing ? "PUT" : "POST";

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || null,
          tags,
        }),
      });

      if (response.ok) {
        setTitle("");
        setUrl("");
        setDescription("");
        setTagsInput("");
        onOpenChange(false);
        onSaved?.();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save doc link");
      }
    } catch {
      alert("Failed to save doc link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("");
      setUrl("");
      setDescription("");
      setTagsInput("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingLink ? "Edit Doc Link" : "New Doc Link"}</DialogTitle>
          <DialogDescription>
            {editingLink ? "Update this link" : "Add a new document link"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL
            </label>
            <Input
              id="url"
              placeholder="https://docs.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <Input
              id="tags"
              placeholder="Comma-separated tags, e.g. Planning, Finance"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

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
