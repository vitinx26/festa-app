const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PartySelector from "@/components/PartySelector";
import EmptyState from "@/components/EmptyState";
import { MENU_CATEGORIES } from "@/lib/partyThemes";

export default function Menu() {
  const [selectedParty, setSelectedParty] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "prato_principal", quantity: "", responsible: "" });
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["menu", selectedParty],
    queryFn: () =>
      selectedParty
        ? db.entities.MenuItem.filter({ party_id: selectedParty })
        : db.entities.MenuItem.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.MenuItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      setShowAdd(false);
      setForm({ name: "", category: "prato_principal", quantity: "", responsible: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.MenuItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.MenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const handleAdd = () => {
    if (!form.name.trim() || !selectedParty) return;
    createMutation.mutate({ ...form, party_id: selectedParty, done: false });
  };

  // Group by category
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category || "prato_principal";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">🍽️ Cardápio</h1>
        {selectedParty && (
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        )}
      </div>

      <PartySelector parties={parties} selectedPartyId={selectedParty} onSelect={setSelectedParty} className="w-full" />

      {!selectedParty ? (
        <EmptyState icon="🍽️" title="Selecione uma festa" description="Escolha uma festa para gerenciar o cardápio" />
      ) : items.length === 0 ? (
        <EmptyState icon="🍽️" title="Cardápio vazio" description="Adicione itens ao cardápio da festa" actionLabel="Adicionar" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const catInfo = MENU_CATEGORIES[cat] || { label: cat, emoji: "🍽️" };
            return (
              <section key={cat}>
                <h2 className="font-heading text-sm font-bold text-muted-foreground mb-3">
                  {catInfo.emoji} {catInfo.label} ({catItems.length})
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {catItems.map((item) => (
                      <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="border-none shadow-sm">
                          <CardContent className="p-3 flex items-center gap-3">
                            <Checkbox
                              checked={item.done}
                              onCheckedChange={() => updateMutation.mutate({ id: item.id, data: { done: !item.done } })}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>
                                {item.name}
                              </p>
                              <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                                {item.quantity && <span>📏 {item.quantity}</span>}
                                {item.responsible && <span>👤 {item.responsible}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Item do Cardápio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do item *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Canjica" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MENU_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade/Porções</Label>
              <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Ex: 30 porções" />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Quem vai preparar?" />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-full">Adicionar ao Cardápio</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}