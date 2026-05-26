const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Transactions() {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => db.entities.Transaction.list("-created_date"),
  });

  const filtered = transactions.filter((tx) => {
    const matchesType = filter === "todos" || tx.type === filter;
    const matchesSearch = !search || tx.client_name?.toLowerCase().includes(search.toLowerCase()) || tx.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalCompras = transactions.filter((t) => t.type === "compra").reduce((s, t) => s + (t.amount || 0), 0);
  const totalPagamentos = transactions.filter((t) => t.type === "pagamento").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Lançamentos</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{transactions.length} no total</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total compras</p>
          <p className="font-heading font-bold text-destructive">R$ {totalCompras.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total pagamentos</p>
          <p className="font-heading font-bold text-emerald-400">R$ {totalPagamentos.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {["todos", "compra", "pagamento"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "compra" ? "Compras" : f === "pagamento" ? "Pagamentos" : "Todos"}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border rounded-xl"
          />
        </div>
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {filtered.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === "pagamento" ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                {tx.type === "pagamento"
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-destructive" />
                }
              </div>
              <div>
                <Link to={`/clientes/${tx.client_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                  {tx.client_name || "Cliente"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {tx.description || (tx.type === "compra" ? "Compra" : "Pagamento")} ·{" "}
                  {tx.created_date && format(new Date(tx.created_date), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <span className={`font-heading font-bold text-sm ${tx.type === "pagamento" ? "text-emerald-400" : "text-destructive"}`}>
              {tx.type === "pagamento" ? "+" : "-"}R$ {(tx.amount || 0).toFixed(2)}
            </span>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum lançamento encontrado
          </div>
        )}
      </div>
    </div>
  );
}