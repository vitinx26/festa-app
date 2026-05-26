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
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PartySelector from "@/components/PartySelector";
import EmptyState from "@/components/EmptyState";
import { SHOPPING_CATEGORIES } from "@/lib/partyThemes";

export default function Shopping() {
  const [selectedParty, setSelectedParty] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", estimated_price: "", category: "outro" });
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["shopping", selectedParty],
    queryFn: () =>
      selectedParty
        ? db.entities.ShoppingItem.filter({ party_id: selectedParty })
        : db.entities.ShoppingItem.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.ShoppingItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping"] });
      setShowAdd(false);
      setForm({ name: "", quantity: "", estimated_price: "", category: "outro" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.ShoppingItem.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.ShoppingItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const handleAdd = () => {
    if (!form.name.trim() || !selectedParty) return;
    createMutation.mutate({
      ...form,
      party_id: selectedParty,
      estimated_price: form.estimated_price ? Number(form.estimated_price) : undefined,
      bought: false,
    });
  };

  const totalEstimated = items.reduce((sum, i) => sum + (i.estimated_price || 0), 0);
  const boughtItems = items.filter((i) => i.bought);
  const pendingItems = items.filter((i) => !i.bought);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">🛒 Lista de Compras</h1>
        {selectedParty && (
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        )}
      </div>

      <PartySelector parties={parties} selectedPartyId={selectedParty} onSelect={setSelectedParty} className="w-full" />

      {selectedParty && items.length > 0 && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="font-heading text-xl font-bold">R$ {totalEstimated.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Progresso</p>
              <p className="font-heading text-xl font-bold">
                {boughtItems.length}/{items.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedParty ? (
        <EmptyState icon="🛒" title="Selecione uma festa" description="Escolha uma festa para ver a lista de compras" />
      ) : items.length === 0 ? (
        <EmptyState icon="🛒" title="Lista vazia" description="Adicione itens à lista de compras" actionLabel="Adicionar" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <section>
              <h2 className="font-heading text-sm font-bold text-muted-foreground mb-3">
                Para comprar ({pendingItems.length})
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingItems.map((item) => (
                    <ShoppingItemCard key={item.id} item={item} onToggle={() => updateMutation.mutate({ id: item.id, data: { bought: !item.bought } })} onDelete={() => deleteMutation.mutate(item.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
          {boughtItems.length > 0 && (
            <section>
              <h2 className="font-heading text-sm font-bold text-muted-foreground mb-3">
                Comprados ({boughtItems.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {boughtItems.map((item) => (
                  <ShoppingItemCard key={item.id} item={item} onToggle={() => updateMutation.mutate({ id: item.id, data: { bought: !item.bought } })} onDelete={() => deleteMutation.mutate(item.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Balões coloridos" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Ex: 50 un" />
              </div>
              <div>
                <Label>Preço est. (R$)</Label>
                <Input type="number" value={form.estimated_price} onChange={(e) => setForm({ ...form, estimated_price: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SHOPPING_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="w-full rounded-full">Adicionar à Lista</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShoppingItemCard({ item, onToggle, onDelete }) {
  const cat = SHOPPING_CATEGORIES[item.category] || SHOPPING_CATEGORIES.outro;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="border-none shadow-sm">
        <CardContent className="p-3 flex items-center gap-3">
          <Checkbox checked={item.bought} onCheckedChange={onToggle} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${item.bought ? "line-through text-muted-foreground" : ""}`}>{item.name}</p>
            <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{cat.emoji} {cat.label}</Badge>
              {item.quantity && <span>📦 {item.quantity}</span>}
            </div>
          </div>
          {item.estimated_price > 0 && (
            <span className="text-sm font-medium text-muted-foreground">R$ {item.estimated_price.toFixed(2)}</span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}