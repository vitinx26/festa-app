const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Clients() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => db.entities.Client.list("-created_date"),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => db.entities.Transaction.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Client.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setOpen(false); setForm({ name: "", phone: "", notes: "" }); },
  });

  const getBalance = (clientId) => {
    const txs = transactions.filter((t) => t.client_id === clientId);
    const debt = txs.filter((t) => t.type === "compra").reduce((s, t) => s + (t.amount || 0), 0);
    const paid = txs.filter((t) => t.type === "pagamento").reduce((s, t) => s + (t.amount || 0), 0);
    return debt - paid;
  };

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clients.length} cadastrado(s)</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-xl gap-2 glow-primary">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border rounded-xl"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Client list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((client, i) => {
            const balance = getBalance(client.id);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/clientes/${client.id}`}>
                  <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-4 hover:border-primary/40 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="font-heading font-bold text-primary">
                          {client.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground">{client.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-heading font-bold text-sm ${balance > 0 ? "text-destructive" : "text-emerald-400"}`}>
                          R$ {Math.abs(balance).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {balance > 0 ? "em aberto" : balance < 0 ? "crédito" : "zerado"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {/* New Client Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do cliente"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input
                placeholder="Opcional..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl glow-primary"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || createMutation.isPending}
            >
              {createMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}