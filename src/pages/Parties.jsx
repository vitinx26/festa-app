const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PARTY_THEMES } from "@/lib/partyThemes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarDays, MapPin, Trash2, Edit, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import CreatePartyDialog from "@/components/party/CreatePartyDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statusLabels = {
  planejando: { label: "Planejando", color: "bg-yellow-100 text-yellow-700" },
  confirmada: { label: "Confirmada", color: "bg-green-100 text-green-700" },
  em_andamento: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  concluida: { label: "Concluída", color: "bg-gray-100 text-gray-500" },
};

export default function Parties() {
  const [showCreate, setShowCreate] = useState(false);
  const [editParty, setEditParty] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Party.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Party.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setEditParty(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Party.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">🎪 Minhas Festas</h1>
        <Button onClick={() => setShowCreate(true)} className="rounded-full gap-2" size="sm">
          <Plus className="w-4 h-4" /> Nova Festa
        </Button>
      </div>

      {parties.length === 0 ? (
        <EmptyState
          icon="🎪"
          title="Nenhuma festa ainda"
          description="Crie sua primeira festa temática e comece a planejar!"
          actionLabel="Criar Festa"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {parties.map((party, i) => {
              const theme = PARTY_THEMES[party.theme] || PARTY_THEMES.outro;
              const status = statusLabels[party.status] || statusLabels.planejando;
              return (
                <motion.div
                  key={party.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-lg transition-all">
                    <div className={`h-28 bg-gradient-to-br ${theme.gradient} flex items-center justify-center relative`}>
                      <span className="text-5xl">{theme.emoji}</span>
                      <Badge className={`absolute top-3 right-3 ${status.color} border-none text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-heading font-bold text-base mb-2">{party.name}</h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {party.date && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {format(new Date(party.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        )}
                        {party.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {party.time}
                          </div>
                        )}
                        {party.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            {party.location}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full text-xs"
                          onClick={() => setEditParty(party)}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-destructive hover:text-destructive text-xs"
                          onClick={() => setDeleteId(party.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <CreatePartyDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={(data) => createMutation.mutate(data)}
      />

      {editParty && (
        <CreatePartyDialog
          open={!!editParty}
          onOpenChange={() => setEditParty(null)}
          editParty={editParty}
          onSave={(data) => updateMutation.mutate({ id: editParty.id, data })}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir festa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}