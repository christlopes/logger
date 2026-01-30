"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CalendarIcon, SearchIcon, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AddTypeDialog } from "@/components/add-type-dialog";
import { NewEntryDialog } from "@/components/new-entry-dialog";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  date: string;
  created_at: string;
  notes: string | null;
  difficulty: string | null;
  type: {
    id: string;
    name: string;
  };
}

interface EntryType {
  id: string;
  name: string;
}

export default function StoragePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [types, setTypes] = useState<EntryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchType, setSearchType] = useState<string>("");
  const [searchDifficulty, setSearchDifficulty] = useState<string>("");
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchDate) {
        params.append("date", searchDate.toISOString().split("T")[0]);
      }
      if (searchType) {
        params.append("type", searchType);
      }
      if (searchDifficulty) {
        params.append("difficulty", searchDifficulty);
      }

      const response = await fetch(`/api/entries?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch {
      // Failed to fetch entries
    } finally {
      setIsLoading(false);
    }
  }, [searchDate, searchType, searchDifficulty]);

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/types");
      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      }
    } catch {
      // Failed to fetch types
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchTypes();
  }, [fetchEntries, fetchTypes]);

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEntries();
      } else {
        alert("Failed to delete entry");
      }
    } catch {
      alert("Failed to delete entry");
    }
  };

  const handleTypeAdded = (newType: EntryType) => {
    setTypes([...types, newType]);
    setIsAddTypeOpen(false);
    fetchTypes();
  };

  // Group entries by type
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, Entry[]> = {};
    entries.forEach((entry) => {
      const typeName = entry.type.name;
      if (!grouped[typeName]) {
        grouped[typeName] = [];
      }
      grouped[typeName].push(entry);
    });
    return grouped;
  }, [entries]);

  const uniqueTypesCount = Object.keys(groupedEntries).length;
  const totalEntriesCount = entries.length;

  const clearSearch = () => {
    setSearchDate(undefined);
    setSearchType("");
    setSearchDifficulty("");
  };

  const handleEdit = async (entry: Entry) => {
    setEditingEntry(entry);
    setIsNewEntryOpen(true);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Consultation History</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddTypeOpen(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Add Type
            </Button>
            <Button
              onClick={() => setIsNewEntryOpen(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              New Entry
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex items-center gap-3 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9",
                  !searchDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {searchDate
                  ? format(searchDate, "dd/MM/yyyy")
                  : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={searchDate}
                onSelect={setSearchDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by type..."
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <select
            value={searchDifficulty}
            onChange={(e) => setSearchDifficulty(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {(searchDate || searchType || searchDifficulty) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-9"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Found {totalEntriesCount} {totalEntriesCount === 1 ? "entry" : "entries"} across{" "}
            {uniqueTypesCount} {uniqueTypesCount === 1 ? "type" : "types"}
          </p>
        </div>

        {/* Entries Grouped by Type */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {totalEntriesCount === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No entries found. Create your first entry!
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedEntries)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([typeName, typeEntries]) => (
                  <AccordionItem key={typeName} value={typeName}>
                    <AccordionTrigger className="px-6 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{typeName}</span>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          {typeEntries.length}{" "}
                          {typeEntries.length === 1 ? "entry" : "entries"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-3">
                        {typeEntries.map((entry) => {
                          const difficulty = entry.difficulty || "Medium";
                          let borderColor = "border-yellow-500";
                          if (difficulty === "Easy") borderColor = "border-green-500";
                          else if (difficulty === "Hard") borderColor = "border-red-500";

                          return (
                            <div
                              key={entry.id}
                              className={`border-l-4 ${borderColor} bg-secondary/50 p-4 rounded-r-md flex items-start justify-between gap-4`}
                            >
                              <div className="flex-1 space-y-1">
                                <div className="text-sm">
                                  <span className="font-medium">Date: </span>
                                  {format(new Date(entry.date), "yyyy-MM-dd")}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Notes: </span>
                                  {entry.notes || "-"}
                                </div>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(entry)}
                                  className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                  title="Edit entry"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(entry.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  title="Delete entry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </div>
      </div>

      <AddTypeDialog
        open={isAddTypeOpen}
        onOpenChange={setIsAddTypeOpen}
        onTypeAdded={handleTypeAdded}
      />

      <NewEntryDialog
        open={isNewEntryOpen}
        onOpenChange={(open) => {
          setIsNewEntryOpen(open);
          if (!open) {
            setEditingEntry(null);
          }
        }}
        onEntryAdded={fetchEntries}
        editingEntry={editingEntry}
      />
    </div>
  );
}
