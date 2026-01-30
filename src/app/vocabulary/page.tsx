"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  created_at: string;
  entry: {
    id: string;
    date: string;
    type: {
      name: string;
    };
  };
}

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVocab, setSelectedVocab] = useState<Vocabulary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const response = await fetch("/api/vocabulary");
      if (response.ok) {
        const data = await response.json();
        setVocabulary(data);
      }
    } catch {
      // Failed to fetch vocabulary
    } finally {
      setIsLoading(false);
    }
  };

  const handleVocabClick = (vocab: Vocabulary) => {
    setSelectedVocab(vocab);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Vocabulary</h1>
        </div>

        {vocabulary.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-8 text-center text-muted-foreground">
            No vocabulary learned yet. Add vocabulary when creating new entries!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vocabulary.map((vocab) => (
              <button
                key={vocab.id}
                onClick={() => handleVocabClick(vocab)}
                className="bg-card border border-border rounded-lg p-4 text-left hover:bg-accent hover:border-primary transition-colors cursor-pointer"
              >
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {vocab.word}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vocab.meaning}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedVocab?.word}</DialogTitle>
            <DialogDescription>
              Vocabulary details
            </DialogDescription>
          </DialogHeader>
          {selectedVocab && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Meaning
                </h4>
                <p className="text-base text-foreground">{selectedVocab.meaning}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Learned
                </h4>
                <p className="text-base text-foreground">
                  {format(new Date(selectedVocab.created_at), "dd MMMM yyyy, HH:mm")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Entry Type
                </h4>
                <p className="text-base text-foreground">
                  {selectedVocab.entry.type.name}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Entry Date
                </h4>
                <p className="text-base text-foreground">
                  {format(new Date(selectedVocab.entry.date), "dd MMMM yyyy")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



