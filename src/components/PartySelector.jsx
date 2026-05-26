import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PARTY_THEMES } from "@/lib/partyThemes";

export default function PartySelector({ parties, selectedPartyId, onSelect, className }) {
  if (!parties || parties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Nenhuma festa criada ainda
      </div>
    );
  }

  return (
    <Select value={selectedPartyId || ""} onValueChange={onSelect}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecione uma festa" />
      </SelectTrigger>
      <SelectContent>
        {parties.map((party) => (
          <SelectItem key={party.id} value={party.id}>
            <span className="flex items-center gap-2">
              <span>{PARTY_THEMES[party.theme]?.emoji || "🎉"}</span>
              <span>{party.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}