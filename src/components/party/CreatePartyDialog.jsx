import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PARTY_THEMES } from "@/lib/partyThemes";

const initialForm = {
  name: "",
  theme: "",
  date: "",
  time: "",
  location: "",
  description: "",
  budget_limit: "",
};

export default function CreatePartyDialog({ open, onOpenChange, onSave, editParty }) {
  const [form, setForm] = useState(editParty || initialForm);

  const handleSave = () => {
    if (!form.name || !form.theme || !form.date) return;
    onSave({
      ...form,
      budget_limit: form.budget_limit ? Number(form.budget_limit) : undefined,
    });
    setForm(initialForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {editParty ? "Editar Festa" : "Nova Festa 🎉"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da festa *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Festa Junina do Bairro"
            />
          </div>
          <div>
            <Label>Tema *</Label>
            <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um tema" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PARTY_THEMES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Local</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ex: Salão de Festas"
            />
          </div>
          <div>
            <Label>Orçamento limite (R$)</Label>
            <Input
              type="number"
              value={form.budget_limit}
              onChange={(e) => setForm({ ...form, budget_limit: e.target.value })}
              placeholder="Ex: 500"
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>
          <Button onClick={handleSave} className="w-full rounded-full font-heading font-bold">
            {editParty ? "Salvar Alterações" : "Criar Festa 🎊"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}