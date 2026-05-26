const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { PARTY_THEMES } from "@/lib/partyThemes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Users, ClipboardList, ShoppingCart, Wallet, PartyPopper, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to}>
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-none shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </Link>
);

export default function Home() {
  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => db.entities.Task.list(),
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests"],
    queryFn: () => db.entities.Guest.list(),
  });

  const { data: shopping = [] } = useQuery({
    queryKey: ["shopping"],
    queryFn: () => db.entities.ShoppingItem.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => db.entities.Expense.list(),
  });

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingTasks = tasks.filter((t) => !t.done).length;
  const confirmedGuests = guests.filter((g) => g.status === "confirmado").length;
  const upcomingParties = parties.filter(
    (p) => p.status !== "concluida"
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <span className="text-5xl block mb-3">🎉</span>
        <h1 className="font-heading text-3xl font-bold">Caderninho de Festa</h1>
        <p className="text-muted-foreground mt-1">
          Organize suas festas temáticas com estilo!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={PartyPopper}
          label="Festas"
          value={parties.length}
          color="bg-primary"
          to="/festas"
        />
        <StatCard
          icon={ClipboardList}
          label="Tarefas pendentes"
          value={pendingTasks}
          color="bg-accent"
          to="/tarefas"
        />
        <StatCard
          icon={Users}
          label="Confirmados"
          value={confirmedGuests}
          color="bg-emerald-500"
          to="/convidados"
        />
        <StatCard
          icon={Wallet}
          label="Total gasto"
          value={`R$ ${totalSpent.toFixed(0)}`}
          color="bg-violet-500"
          to="/orcamento"
        />
      </div>

      {/* Upcoming Parties */}
      {upcomingParties.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold">Próximas Festas</h2>
            <Link
              to="/festas"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingParties.slice(0, 3).map((party, i) => {
              const theme = PARTY_THEMES[party.theme] || PARTY_THEMES.outro;
              return (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/festas?id=${party.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow border-none shadow-sm">
                      <CardContent className="p-0">
                        <div className="flex items-center">
                          <div
                            className={`w-20 h-20 bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-3xl shrink-0`}
                          >
                            {theme.emoji}
                          </div>
                          <div className="flex-1 px-4 py-3">
                            <h3 className="font-heading font-bold text-sm">
                              {party.name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <CalendarDays className="w-3 h-3" />
                              {party.date &&
                                format(new Date(party.date), "dd 'de' MMMM", {
                                  locale: ptBR,
                                })}
                            </div>
                            {party.location && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                📍 {party.location}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground mr-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="font-heading text-lg font-bold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/festas", icon: "🎪", label: "Nova Festa" },
            { to: "/tarefas", icon: "✅", label: "Tarefas" },
            { to: "/convidados", icon: "👥", label: "Convidados" },
            { to: "/cardapio", icon: "🍽️", label: "Cardápio" },
            { to: "/compras", icon: "🛒", label: "Compras" },
            { to: "/orcamento", icon: "💰", label: "Orçamento" },
          ].map((item, i) => (
            <motion.div
              key={item.to}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={item.to}>
                <Card className="hover:shadow-md transition-all cursor-pointer border-none shadow-sm">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}