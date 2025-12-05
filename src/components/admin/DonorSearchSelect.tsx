import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DonorOption {
  id: string;
  donor_id: string;
  first_name: string;
  last_name: string;
}

interface DonorSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  excludeDonorId?: string; // Exclude this donor from the list (e.g., can't refer themselves)
  placeholder?: string;
}

const DonorSearchSelect = ({ 
  value, 
  onChange, 
  excludeDonorId,
  placeholder = "Search donors..." 
}: DonorSearchSelectProps) => {
  const [open, setOpen] = useState(false);
  const [donors, setDonors] = useState<DonorOption[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<DonorOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch donors when search query changes
  useEffect(() => {
    const fetchDonors = async () => {
      let query = supabase
        .from("donors")
        .select("id, donor_id, first_name, last_name")
        .order("last_name", { ascending: true })
        .limit(20);

      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,donor_id.ilike.%${searchQuery}%`
        );
      }

      if (excludeDonorId) {
        query = query.neq("id", excludeDonorId);
      }

      const { data } = await query;
      setDonors(data || []);
    };

    fetchDonors();
  }, [searchQuery, excludeDonorId]);

  // Fetch selected donor details when value changes
  useEffect(() => {
    const fetchSelectedDonor = async () => {
      if (value) {
        const { data } = await supabase
          .from("donors")
          .select("id, donor_id, first_name, last_name")
          .eq("id", value)
          .single();
        setSelectedDonor(data);
      } else {
        setSelectedDonor(null);
      }
    };

    fetchSelectedDonor();
  }, [value]);

  const handleSelect = (donorId: string) => {
    const donor = donors.find((d) => d.id === donorId);
    if (donor) {
      onChange(donor.id);
      setSelectedDonor(donor);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSelectedDonor(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedDonor ? (
            <span className="truncate">
              {selectedDonor.donor_id} - {selectedDonor.first_name} {selectedDonor.last_name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedDonor && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by name or ID..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No donors found.</CommandEmpty>
            <CommandGroup>
              {donors.map((donor) => (
                <CommandItem
                  key={donor.id}
                  value={donor.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === donor.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{donor.donor_id}</span>
                  <span className="ml-2 text-muted-foreground">
                    {donor.first_name} {donor.last_name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DonorSearchSelect;
