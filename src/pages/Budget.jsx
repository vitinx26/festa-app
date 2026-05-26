const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PartySelector from "@/components/PartySelector";
import EmptyState from "@/components/EmptyState";
import { EXPENSE_CATEGORIES } from "@/lib/partyThemes";

const PIE_COLORS = ["#f97316", "#8b5cf6", "#ec4899", "#10b981", "#06b6d4", "#eab308", "#ef4444", "#6366f1"];

export default function Budget() {
  const [selectedParty, setSelectedParty] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "outro", paid: false });
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", selectedParty],
    queryFn: () =>
      selectedParty
        ? db.entities.Expense.filter({ party_id: selectedParty })
        : db.entities.Expense.list("-created_date"),
  });

  const selectedPartyData = parties.find((p) => p.id === selectedParty);

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowAdd(false);
      setForm({ description: "", amount: "", category: "outro", paid: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Expense.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const handleAdd = () => {
    if (!form.description.trim() || !form.amount || !selectedParty) return;
    createMutation.mutate({
      ...form,
      party_id: selectedParty,
      amount: Number(form.amount),
      date: new Date().toISOString().split("T")[0],
    });
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetLimit = selectedPartyData?.budget_limit || 0;
  const budgetPercent = budgetLimit > 0 ? Math.min((totalSpent / budgetLimit) * 100, 100) : 0;
  const remaining = budgetLimit - totalSpent;

  // Pie chart data
  const categoryTotals = {};
  expenses.forEach((e) => {
    const cat = e.category || "outro";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
  });
  const pieData = Object.entries(categoryTotals).map(([key, value]) => ({
    name: EXPENSE_CATEGORIES[key]?.label || key,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">💰 Orçamento</h1>
        {selectedParty && (
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> Novo Gasto
          </Button>
        )}
      </div>

      <PartySelector parties={parties} selectedPartyId={selectedParty} onSelect={setSelectedParty} className="w-full" />

      {selectedParty && (
        <>
          {/* Budget Overview */}
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                  <p className="font-heading text-3xl font-bold">R$ {totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
              </div>
              {budgetLimit > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Limite: R$ {budgetLimit.toFixed(2)}</span>
                    <span>{budgetPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={budgetPercent} className="h-2" />
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    {remaining >= 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">R$ {remaining.toFixed(2)} restante</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 text-destructive" />
                        <span className="text-destructive font-medium">R$ {Math.abs(remaining).toFixed(2)} acima do limite</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-heading text-sm font-bold mb-3">Gastos por Categoria</h3>
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `R$ ${val.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map((item, i) => (
                    <Badge key={item.name} variant="secondary" className="text-[10px]">
                      <span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedParty ? (
        <EmptyState icon="💰" title="Selecione uma festa" description="Escolha uma festa para gerenciar o orçamento" />
      ) : expenses.length === 0 ? (
        <EmptyState icon="💰" title="Sem gastos" description="Registre os gastos da festa" actionLabel="Novo Gasto" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {expenses.map((expense) => {
              const cat = EXPENSE_CATEGORIES[expense.category] || EXPENSE_CATEGORIES.outro;
              return (
                <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{expense.description}</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                          {cat.label}
                        </Badge>
                      </div>
                      <p className="font-heading font-bold text-sm">R$ {expense.amount?.toFixed(2)}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(expense.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Decoração mesa" />
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="w-full rounded-full">Registrar Gasto</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}