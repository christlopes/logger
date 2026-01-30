"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, Plus, X } from "lucide-react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EntryType {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  date: string;
  type: {
    id: string;
    name: string;
  };
  notes: string | null;
  difficulty: string | null;
}

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryAdded?: () => void;
  editingEntry?: Entry | null;
}

export function NewEntryDialog({
  open,
  onOpenChange,
  onEntryAdded,
  editingEntry,
}: NewEntryDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [typeId, setTypeId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [types, setTypes] = useState<EntryType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vocabulary, setVocabulary] = useState<Array<{ word: string; meaning: string }>>([]);

  useEffect(() => {
    if (open) {
      fetchTypes();
      if (editingEntry) {
        setDate(new Date(editingEntry.date));
        setTypeId(editingEntry.type.id);
        setNotes(editingEntry.notes || "");
        setDifficulty(editingEntry.difficulty || "Medium");
        setVocabulary([]); // Vocabulary editing can be added later if needed
      } else {
        // Reset form for new entry
        setDate(new Date());
        setTypeId("");
        setNotes("");
        setDifficulty("Medium");
        setVocabulary([]);
      }
    }
  }, [open, editingEntry]);

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      }
    } catch {
      // Failed to fetch types
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !typeId) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!editingEntry;
      const url = isEditing ? `/api/entries/${editingEntry.id}` : "/api/entries";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date.toISOString().split("T")[0],
          typeId,
          notes: notes.trim() || null,
          difficulty: difficulty || "Medium",
        }),
      });

      if (response.ok) {
        const entryData = await response.json();
        
        // Create vocabulary entries if any (only for new entries)
        if (!isEditing && vocabulary.length > 0) {
          await fetch("/api/vocabulary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entryId: entryData.id,
              vocabulary,
            }),
          });
        }
        
        // Reset form
        setDate(new Date());
        setTypeId("");
        setNotes("");
        setDifficulty("Medium");
        setVocabulary([]);
        onOpenChange(false);
        if (onEntryAdded) {
          onEntryAdded();
        }
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${isEditing ? "update" : "save"} entry`);
      }
    } catch {
      alert("Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setDate(new Date());
      setTypeId("");
      setNotes("");
      setDifficulty("Medium");
      setVocabulary([]);
    }
    onOpenChange(newOpen);
  };

  const addVocabularyField = () => {
    setVocabulary([...vocabulary, { word: "", meaning: "" }]);
  };

  const removeVocabularyField = (index: number) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  const updateVocabulary = (index: number, field: "word" | "meaning", value: string) => {
    const updated = [...vocabulary];
    updated[index] = { ...updated[index], [field]: value };
    setVocabulary(updated);
  };

  const typeOptions = types.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEntry ? "Edit Entry" : "New Data Entry"}</DialogTitle>
          <DialogDescription>
            {editingEntry ? "Update entry details" : "Add a new entry to your log"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "dd/mm/yyyy"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <Combobox
              options={typeOptions}
              value={typeId}
              onValueChange={setTypeId}
              placeholder="Enter type (e.g., Meeting, Task, Note)"
              searchPlaceholder="Search types..."
              emptyText="No type found."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <RadioGroup
              value={difficulty}
              onValueChange={setDifficulty}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Easy" id="easy" />
                <Label htmlFor="easy" className="cursor-pointer">
                  Easy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Hard" id="hard" />
                <Label htmlFor="hard" className="cursor-pointer">
                  Hard
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes/Comments
            </label>
            <Textarea
              id="notes"
              placeholder="Enter your notes or comments here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Vocabulary</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVocabularyField}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {vocabulary.length > 0 && (
              <div className="space-y-3 border rounded-lg p-4 bg-secondary/30">
                {vocabulary.map((vocab, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Word"
                        value={vocab.word}
                        onChange={(e) =>
                          updateVocabulary(index, "word", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Meaning"
                        value={vocab.meaning}
                        onChange={(e) =>
                          updateVocabulary(index, "meaning", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVocabularyField(index)}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

