"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocLinkDialog } from "@/components/doc-link-dialog";

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
  created_at: string;
}

export default function DocLinksPage() {
  const [links, setLinks] = useState<DocLink[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DocLink | null>(null);

  const fetchLinks = useCallback(async (tag?: string | null) => {
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (tag) params.append("tag", tag);
      const response = await fetch(`/api/doc-links?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      } else {
        setLoadError("Failed to load doc links.");
      }
    } catch {
      setLoadError("Failed to load doc links.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      }
    } catch {
      // Failed to fetch tags
    }
  }, []);

  useEffect(() => {
    fetchLinks(selectedTag);
    fetchTags();
  }, [fetchLinks, fetchTags, selectedTag]);

  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      const response = await fetch(`/api/doc-links/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchLinks(selectedTag);
        fetchTags();
      } else {
        alert("Failed to delete link");
      }
    } catch {
      alert("Failed to delete link");
    }
  };

  const handleSaved = () => {
    fetchLinks(selectedTag);
    fetchTags();
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
          <h1 className="text-3xl font-bold text-foreground">Doc Links</h1>
          <Button
            onClick={() => {
              setEditingLink(null);
              setIsDialogOpen(true);
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            + Add Link
          </Button>
        </div>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => handleTagFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagFilter(tag.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === tag.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {links.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {selectedTag
              ? `No doc links with tag "${selectedTag}".`
              : "No doc links yet. Add your first link to get started!"}
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {link.title}
                    </a>
                    {link.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  {link.description && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      {link.description}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingLink(link);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                    title="Edit link"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    title="Delete link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocLinkDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLink(null);
        }}
        onSaved={handleSaved}
        editingLink={editingLink}
      />
    </div>
  );
}
