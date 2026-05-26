const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "compra", amount: "", description: "" });

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: () => db.entities.Client.filter({ id }),
    select: (data) => data[0],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", id],
    queryFn: () => db.entities.Transaction.filter({ client_id: id }, "-created_date"),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => db.entities.MenuItem.list(),
  });

  const createTx = useMutation({
    mutationFn: (data) =>
      db.entities.Transaction.create({
        ...data,
        client_id: id,
        client_name: client?.name,
        amount: parseFloat(data.amount),
        date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", id] });
      setOpen(false);
      setForm({ type: "compra", amount: "", description: "" });
    },
  });

  const deleteTx = useMutation({
    mutationFn: (txId) => db.entities.Transaction.delete(txId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", id] });
    },
  });

  const totalDebt = transactions.filter((t) => t.type === "compra").reduce((s, t) => s + (t.amount || 0), 0);
  const totalPaid = transactions.filter((t) => t.type === "pagamento").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalDebt - totalPaid;

  if (!client) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando...</div>
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link to="/clientes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Clientes
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <span className="font-heading font-bold text-2xl text-primary">
                {client.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">{client.name}</h1>
              {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="sm" className="rounded-xl gap-1.5 glow-primary">
            <Plus className="w-4 h-4" /> Lançar
          </Button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-destructive font-heading font-bold text-lg">R$ {totalDebt.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Compras</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-emerald-400 font-heading font-bold text-lg">R$ {totalPaid.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pagamentos</p>
        </div>
        <div className={`rounded-2xl p-4 text-center border ${balance > 0 ? "bg-destructive/10 border-destructive/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
          <p className={`font-heading font-bold text-lg ${balance > 0 ? "text-destructive" : "text-emerald-400"}`}>
            R$ {Math.abs(balance).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{balance > 0 ? "Em aberto" : "Crédito"}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">Histórico</h2>
        <AnimatePresence>
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "pagamento" ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                  {tx.type === "pagamento"
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-destructive" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.description || (tx.type === "compra" ? "Compra" : "Pagamento")}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.created_date && format(new Date(tx.created_date), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-heading font-bold text-sm ${tx.type === "pagamento" ? "text-emerald-400" : "text-destructive"}`}>
                  {tx.type === "pagamento" ? "+" : "-"}R$ {(tx.amount || 0).toFixed(2)}
                </span>
                <button
                  onClick={() => deleteTx.mutate(tx.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {transactions.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhum lançamento ainda
          </div>
        )}
      </div>

      {/* New Transaction Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm({ ...form, type: "compra" })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === "compra" ? "bg-destructive text-white" : "bg-secondary text-muted-foreground"}`}
              >
                Compra / Débito
              </button>
              <button
                onClick={() => setForm({ ...form, type: "pagamento" })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === "pagamento" ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"}`}
              >
                Pagamento
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="bg-secondary border-border rounded-xl text-lg font-heading"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Cerveja, pagamento conta..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-secondary border-border rounded-xl"
              />
            </div>

            {menuItems.length > 0 && form.type === "compra" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Itens do cardápio (opcional)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {menuItems.filter((m) => m.active !== false).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const price = item.price || 0;
                        const desc = form.description ? `${form.description}, ${item.name}` : item.name;
                        const amount = (parseFloat(form.amount || 0) + price).toFixed(2);
                        setForm({ ...form, description: desc, amount });
                      }}
                      className="px-2.5 py-1 bg-secondary hover:bg-primary/20 hover:border-primary rounded-lg text-xs border border-border transition-all"
                    >
                      {item.name} · R$ {item.price?.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full rounded-xl"
              onClick={() => createTx.mutate(form)}
              disabled={!form.amount || createTx.isPending}
            >
              {createTx.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}