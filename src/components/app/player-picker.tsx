import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TeamFlag } from "@/components/app/team-flag";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

type Player = {
  id: string;
  name: string;
  team_id: string | null;
  team: { name: string; code: string | null; flag_emoji: string | null } | null;
};

type PlayerPickerProps = {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function PlayerPicker({
  value,
  onChange,
  disabled,
  placeholder = "Caută jucător...",
  className,
}: PlayerPickerProps) {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("players")
      .select("id,name,team_id,team:teams(name,code,flag_emoji)")
      .order("name")
      .then(({ data }) => {
        setPlayers((data ?? []) as unknown as Player[]);
        setLoaded(true);
      });
  }, []);

  if (loaded && players.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="ex. Kylian Mbappé (importă jucători în Admin)"
        className={className}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-11 w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Caută după nume sau echipă..." />
          <CommandList>
            <CommandEmpty>Niciun jucător găsit.</CommandEmpty>
            <CommandGroup>
              {players.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.team?.name ?? ""}`}
                  onSelect={() => {
                    onChange(p.name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === p.name ? "opacity-100" : "opacity-0")} />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {p.team && (
                      <TeamFlag
                        code={p.team.code}
                        name={p.team.name}
                        emoji={p.team.flag_emoji}
                        size="xs"
                      />
                    )}
                    <span className="truncate">
                      {p.name}
                      {p.team?.name && (
                        <span className="ml-1 text-xs text-muted-foreground">· {p.team.name}</span>
                      )}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
