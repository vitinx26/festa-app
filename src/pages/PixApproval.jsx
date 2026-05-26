const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const statusConfig = {
  aguardando: { label: "Aguardando", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  aprovado: { label: "Aprovado", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  rejeitado: { label: "Rejeitado", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function PixApproval() {
  const qc = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filter, setFilter] = useState("aguardando");

  const { data: payments = [] } = useQuery({
    queryKey: ["pix-payments", filter],
    queryFn: () =>
      filter === "todos"
        ? db.entities.PixPayment.list("-created_date")
        : db.entities.PixPayment.filter({ status: filter }, "-created_date"),
  });

  const approveMutation = useMutation({
    mutationFn: async (payment) => {
      // Create transaction
      const tx = await db.entities.Transaction.create({
        client_id: payment.client_id,
        client_name: payment.client_name,
        type: "pagamento",
        amount: payment.amount,
        description: `Pagamento PIX (comprovante aprovado)`,
        date: new Date().toISOString().split("T")[0],
      });
      // Update payment status
      await db.entities.PixPayment.update(payment.id, {
        status: "aprovado",
        transaction_id: tx.id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pix-payments"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => db.entities.PixPayment.update(id, { status: "rejeitado" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pix-payments"] }),
  });

  const pending = payments.filter((p) => p.status === "aguardando").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Pagamentos PIX</h1>
          {pending > 0 && (
            <p className="text-sm text-yellow-400 mt-0.5">{pending} comprovante{pending > 1 ? "s" : ""} aguardando análise</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-secondary/40 rounded-xl p-1 w-fit">
        {["aguardando", "aprovado", "rejeitado", "todos"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "aguardando" ? "Pendentes" : f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {payments.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum pagamento {filter !== "todos" ? filter : "registrado"}</p>
            </div>
          )}
          {payments.map((payment) => {
            const sc = statusConfig[payment.status];
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">
                        {payment.client_name || payment.client_email}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{payment.client_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.created_date && format(new Date(payment.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="font-heading font-bold text-primary text-lg mt-1">
                      R$ {Number(payment.amount).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {payment.receipt_url && (
                      <button
                        onClick={() => setPreviewUrl(payment.receipt_url)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver comprovante
                      </button>
                    )}
                    {payment.status === "aguardando" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-red-400 border-red-500/30 hover:bg-red-500/10 h-8 px-3 text-xs"
                          onClick={() => rejectMutation.mutate(payment.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-lg bg-green-600 hover:bg-green-700 h-8 px-3 text-xs"
                          onClick={() => approveMutation.mutate(payment)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Receipt Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="bg-card border-border rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              Comprovante de Pagamento
              <a href={previewUrl} target="_blank" rel="noreferrer" className="ml-auto">
                <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl overflow-hidden bg-secondary">
            <img src={previewUrl} alt="Comprovante" className="w-full object-contain max-h-[60vh]" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}