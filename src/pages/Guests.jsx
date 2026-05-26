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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Phone, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PartySelector from "@/components/PartySelector";
import EmptyState from "@/components/EmptyState";
import { GUEST_STATUSES } from "@/lib/partyThemes";

export default function Guests() {
  const [selectedParty, setSelectedParty] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", status: "pendente", notes: "" });
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests", selectedParty],
    queryFn: () =>
      selectedParty
        ? db.entities.Guest.filter({ party_id: selectedParty })
        : db.entities.Guest.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Guest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      setShowAdd(false);
      setForm({ name: "", phone: "", status: "pendente", notes: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Guest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guests"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Guest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guests"] }),
  });

  const handleAdd = () => {
    if (!form.name.trim() || !selectedParty) return;
    createMutation.mutate({ ...form, party_id: selectedParty });
  };

  const statusCounts = Object.entries(GUEST_STATUSES).map(([key, val]) => ({
    key,
    ...val,
    count: guests.filter((g) => g.status === key).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">👥 Convidados</h1>
        {selectedParty && (
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2" size="sm">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        )}
      </div>

      <PartySelector
        parties={parties}
        selectedPartyId={selectedParty}
        onSelect={setSelectedParty}
        className="w-full"
      />

      {/* Status Summary */}
      {selectedParty && guests.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {statusCounts.map((s) => (
            <Card key={s.key} className="border-none shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-heading font-bold">{s.count}</p>
                <p className="text-[10px] text-muted-foreground">{s.icon} {s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!selectedParty ? (
        <EmptyState icon="👥" title="Selecione uma festa" description="Escolha uma festa para gerenciar os convidados" />
      ) : guests.length === 0 ? (
        <EmptyState icon="👥" title="Sem convidados" description="Adicione convidados para esta festa" actionLabel="Adicionar" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {guests.map((guest) => {
              const status = GUEST_STATUSES[guest.status] || GUEST_STATUSES.pendente;
              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-heading font-bold text-sm">
                        {guest.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{guest.name}</p>
                        {guest.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {guest.phone}
                          </p>
                        )}
                        {guest.notes && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MessageSquare className="w-3 h-3" /> {guest.notes}
                          </p>
                        )}
                      </div>
                      <Select
                        value={guest.status}
                        onValueChange={(v) => updateMutation.mutate({ id: guest.id, data: { status: v } })}
                      >
                        <SelectTrigger className="w-auto border-none shadow-none">
                          <Badge className={`${status.color} border-none text-xs`}>
                            {status.icon} {status.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GUEST_STATUSES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(guest.id)}>
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
            <DialogTitle className="font-heading">Novo Convidado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do convidado" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Alergias, restrições..." rows={2} />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-full">Adicionar Convidado</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}