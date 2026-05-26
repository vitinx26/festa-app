const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function MenuPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", category: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => db.entities.MenuItem.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.MenuItem.create({ ...data, price: parseFloat(data.price), active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menuItems"] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.MenuItem.update(id, { ...data, price: parseFloat(data.price) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menuItems"] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.MenuItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });

  const resetForm = () => { setOpen(false); setEditing(null); setForm({ name: "", price: "", category: "" }); };

  const handleEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price?.toString() || "", category: item.category || "" });
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) { updateMutation.mutate({ id: editing.id, data: form }); }
    else { createMutation.mutate(form); }
  };

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Cardápio</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{items.length} item(ns)</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-xl gap-2 glow-primary">
          <Plus className="w-4 h-4" /> Novo item
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <h2 className="font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {cat}
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {catItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-primary">R$ {(item.price || 0).toFixed(2)}</span>
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading font-semibold mb-1">Cardápio vazio</p>
          <p className="text-sm text-muted-foreground">Adicione os itens que você vende</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Cerveja Heineken" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$) *</Label>
              <Input type="number" placeholder="0,00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input placeholder="Ex: Bebida, Petisco..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border rounded-xl" />
            </div>
            <Button className="w-full rounded-xl" onClick={handleSave} disabled={!form.name || !form.price || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}