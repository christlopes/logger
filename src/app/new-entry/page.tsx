"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Combobox } from "@/components/ui/combobox";
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

export default function NewEntryPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [typeId, setTypeId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [types, setTypes] = useState<EntryType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      }
    } catch (error) {
      console.error("Error fetching types:", error);
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
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date.toISOString().split("T")[0],
          typeId,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        router.push("/storage");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save entry");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = types.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">New Data Entry</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/storage")}
            className="bg-gray-100 text-black hover:bg-gray-200"
          >
            Storage
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-black">Add New Entry</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-black">
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
              <label
                htmlFor="type"
                className="text-sm font-medium text-black"
              >
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
              <label
                htmlFor="notes"
                className="text-sm font-medium text-black"
              >
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-black/90"
            >
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

