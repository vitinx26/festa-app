const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingDown, TrendingUp, Receipt, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </motion.div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => db.entities.Client.list("-created_date"),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => db.entities.Transaction.list("-created_date"),
  });

  const activeClients = clients.filter((c) => c.active !== false);

  // Calculate balances per client
  const clientBalances = clients.map((client) => {
    const clientTx = transactions.filter((t) => t.client_id === client.id);
    const totalDebt = clientTx
      .filter((t) => t.type === "compra")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPaid = clientTx
      .filter((t) => t.type === "pagamento")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { ...client, balance: totalDebt - totalPaid };
  });

  const totalDebt = clientBalances.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const clientsWithDebt = clientBalances.filter((c) => c.balance > 0).length;
  const recentTransactions = [...transactions].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  ).slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do crediário</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Clientes ativos"
          value={activeClients.length}
          color="bg-primary"
          to="/clientes"
        />
        <StatCard
          icon={TrendingDown}
          label="Total em aberto"
          value={`R$ ${totalDebt.toFixed(2)}`}
          sub={`${clientsWithDebt} cliente(s) com saldo`}
          color="bg-destructive"
          to="/clientes"
        />
        <StatCard
          icon={Receipt}
          label="Lançamentos"
          value={transactions.length}
          color="bg-violet-600"
          to="/lancamentos"
        />
        <StatCard
          icon={TrendingUp}
          label="Pagamentos"
          value={transactions.filter((t) => t.type === "pagamento").length}
          color="bg-emerald-600"
          to="/lancamentos"
        />
      </div>

      {/* Clients with highest balance */}
      {clientsWithDebt > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">Maiores saldos</h2>
            <Link to="/clientes" className="text-xs text-primary flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {clientBalances
              .filter((c) => c.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 5)
              .map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/clientes/${client.id}`}>
                    <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                          <span className="font-heading font-bold text-sm text-primary">
                            {client.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-sm">{client.name}</span>
                      </div>
                      <span className="font-heading font-bold text-destructive text-sm">
                        R$ {client.balance.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">Lançamentos recentes</h2>
            <Link to="/lancamentos" className="text-xs text-primary flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{tx.client_name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.description || (tx.type === "compra" ? "Compra" : "Pagamento")} ·{" "}
                    {tx.created_date && format(new Date(tx.created_date), "dd/MM", { locale: ptBR })}
                  </p>
                </div>
                <span
                  className={`font-heading font-bold text-sm ${
                    tx.type === "pagamento" ? "text-emerald-400" : "text-destructive"
                  }`}
                >
                  {tx.type === "pagamento" ? "+" : "-"}R$ {(tx.amount || 0).toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {transactions.length === 0 && clients.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-foreground mb-2">Comece aqui</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Adicione clientes e registre os primeiros lançamentos
          </p>
          <Link
            to="/clientes"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all"
          >
            <Users className="w-4 h-4" />
            Adicionar cliente
          </Link>
        </div>
      )}
    </div>
  );
}