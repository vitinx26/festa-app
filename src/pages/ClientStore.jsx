const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogOut, ShoppingCart, Plus, Minus, QrCode, Ticket, Receipt, PartyPopper, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PixPaymentModal from "@/components/PixPaymentModal";

const statusConfig = {
  confirmado: { label: "Confirmado", icon: CheckCircle, color: "bg-green-500/10 text-green-400 border-green-500/20" },
  pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function ClientStore({ user }) {
  const [tab, setTab] = useState("loja");
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [pixOpen, setPixOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const qc = useQueryClient();

  const { data: menuItems = [] } = useQuery({
    queryKey: ["menuItems-store"],
    queryFn: () => db.entities.MenuItem.filter({ active: true }),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", user.email],
    queryFn: () => db.entities.Ticket.filter({ buyer_email: user.email }),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["my-transactions", user.email],
    queryFn: () => db.entities.Transaction.filter({ client_email: user.email }, "-created_date"),
  });

  // Group items by category
  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item?.price || 0) * qty;
  }, 0);

  const updateCart = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const newQty = (next[id] || 0) + delta;
      if (newQty <= 0) delete next[id];
      else next[id] = newQty;
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ item: menuItems.find((m) => m.id === id), qty }))
    .filter((c) => c.item);

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
          <div className="flex items-center gap-2">
            {totalItems > 0 && tab === "loja" && (
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="relative p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              </button>
            )}
            <button
              onClick={() => db.auth.logout()}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-24">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="text-xl font-bold font-heading text-foreground">
            Olá, {user.full_name?.split(" ")[0] || "bem-vindo"}! 👋
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">{user.email}</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-secondary/40 rounded-xl p-1">
          {[
            { id: "loja", label: "Comprar", icon: ShoppingCart },
            { id: "tickets", label: "Ingressos", icon: Ticket },
            { id: "historico", label: "Histórico", icon: Receipt },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ===== LOJA ===== */}
        {tab === "loja" && (
          <div className="space-y-5">
            {/* Cart summary (inline) */}
            {cartOpen && cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-primary/30 rounded-xl p-4 space-y-3"
              >
                <p className="font-semibold text-sm text-foreground">Carrinho</p>
                {cartItems.map(({ item, qty }) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.name} × {qty}</span>
                    <span className="text-primary font-medium">R$ {(item.price * qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full rounded-xl gap-2" onClick={() => { setCartOpen(false); setPixOpen(true); }}>
                  <QrCode className="w-4 h-4" />
                  Pagar agora
                </Button>
              </motion.div>
            )}

            {Object.keys(grouped).length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhum item disponível no momento</p>
              </div>
            )}

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{category}</p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.name}</p>
                        <p className="text-primary font-bold text-sm">R$ {Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cart[item.id] ? (
                          <>
                            <button
                              onClick={() => updateCart(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{cart[item.id]}</span>
                          </>
                        ) : null}
                        <button
                          onClick={() => updateCart(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== INGRESSOS ===== */}
        {tab === "tickets" && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <PartyPopper className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum ingresso encontrado</p>
                <p className="text-sm mt-1">Seus ingressos aparecerão aqui.</p>
              </div>
            ) : tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.pendente;
              const Icon = status.icon;
              return (
                <div key={ticket.id} className="bg-card border border-border rounded-xl p-4">
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
                      <Icon className="w-3 h-3" />{status.label}
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
            })}
          </div>
        )}

        {/* ===== HISTÓRICO ===== */}
        {tab === "historico" && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma transação encontrada</p>
              </div>
            ) : transactions.map((tx) => (
              <div key={tx.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {tx.description || (tx.type === "compra" ? "Compra" : "Pagamento")}
                  </p>
                  {tx.date && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(tx.date), "dd/MM/yyyy")}</p>}
                </div>
                <span className={`font-bold ${tx.type === "compra" ? "text-red-400" : "text-green-400"}`}>
                  {tx.type === "compra" ? "-" : "+"} R$ {Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sticky pay button when cart has items */}
      {tab === "loja" && totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full rounded-xl gap-2 glow-primary"
              onClick={() => setPixOpen(true)}
            >
              <QrCode className="w-4 h-4" />
              Pagar R$ {cartTotal.toFixed(2)} ({totalItems} ite{totalItems > 1 ? "ns" : "m"})
            </Button>
          </div>
        </div>
      )}

      <PixPaymentModal
        open={pixOpen}
        onOpenChange={setPixOpen}
        user={user}
        prefilledAmount={cartTotal > 0 ? cartTotal.toFixed(2) : ""}
      />
    </div>
  );
}