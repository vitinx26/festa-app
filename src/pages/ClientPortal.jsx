const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Ticket, Receipt, LogOut, PartyPopper, Clock, CheckCircle, XCircle, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PixPaymentModal from "@/components/PixPaymentModal";

const statusConfig = {
  confirmado: { label: "Confirmado", icon: CheckCircle, color: "bg-green-500/10 text-green-400 border-green-500/20" },
  pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("tickets");
  const [pixOpen, setPixOpen] = useState(false);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {
      db.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", user?.email],
    queryFn: () => db.entities.Ticket.filter({ buyer_email: user.email }),
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["my-transactions", user?.email],
    queryFn: () => db.entities.Transaction.filter({ client_name: user.full_name }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-foreground">Festas Fusion</span>
          </div>
          <button
            onClick={() => db.auth.logout()}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary flex items-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Olá, {user.full_name?.split(" ")[0] || "bem-vindo"}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
          <Button
            onClick={() => setPixOpen(true)}
            className="mt-3 rounded-xl gap-2 glow-primary"
          >
            <QrCode className="w-4 h-4" />
            Pagar via PIX
          </Button>
        </motion.div>

        <PixPaymentModal
          open={pixOpen}
          onOpenChange={setPixOpen}
          user={user}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-secondary/40 rounded-xl p-1">
          <button
            onClick={() => setTab("tickets")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "tickets"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Meus Ingressos
          </button>
          <button
            onClick={() => setTab("transactions")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "transactions"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Transações
          </button>
        </div>

        {/* Tickets Tab */}
        {tab === "tickets" && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {tickets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <PartyPopper className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum ingresso encontrado</p>
                <p className="text-sm mt-1">Seus ingressos aparecerão aqui após a compra.</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.pendente;
                const Icon = status.icon;
                return (
                  <div
                    key={ticket.id}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{ticket.party_name}</h3>
                        {ticket.party_date && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {format(new Date(ticket.party_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${status.color}`}>
                        <Icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-border/50">
                      <span className="text-muted-foreground">
                        {ticket.quantity} ingresso{ticket.quantity > 1 ? "s" : ""} · R$ {Number(ticket.price_per_ticket).toFixed(2)} cada
                      </span>
                      <span className="font-bold text-primary">
                        R$ {Number(ticket.total_amount || ticket.quantity * ticket.price_per_ticket).toFixed(2)}
                      </span>
                    </div>
                    {ticket.ticket_code && (
                      <div className="mt-2 bg-muted rounded-lg px-3 py-1.5 text-xs text-center font-mono text-muted-foreground">
                        Cód: {ticket.ticket_code}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Transactions Tab */}
        {tab === "transactions" && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma transação encontrada</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {tx.description || (tx.type === "compra" ? "Compra" : "Pagamento")}
                    </p>
                    {tx.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(tx.date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <span className={`font-bold ${tx.type === "compra" ? "text-red-400" : "text-green-400"}`}>
                    {tx.type === "compra" ? "-" : "+"} R$ {Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}