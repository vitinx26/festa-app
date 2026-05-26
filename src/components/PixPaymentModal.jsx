const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Upload, QrCode, CheckCircle, CreditCard, ExternalLink } from "lucide-react";

const PIX_KEY = "49994621840";
const MP_LINK = "https://link.mercadopago.com.br/festasapp";
const CARD_FEE = 6.00;

export default function PixPaymentModal({ open, onOpenChange, user, clientId, clientName, prefilledAmount = "" }) {
  const [method, setMethod] = useState(null); // "pix" | "card"
  const [step, setStep] = useState(1); // 1: valor, 2: info/pix, 3: upload, 4: sucesso
  const [amount, setAmount] = useState(prefilledAmount);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const cardTotal = parsedAmount + CARD_FEE;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = async () => {
    if (!file || !amount) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    await db.entities.PixPayment.create({
      client_id: clientId || "",
      client_name: clientName || user.full_name,
      client_email: user.email,
      amount: parsedAmount,
      receipt_url: file_url,
      status: "aguardando",
    });
    setUploading(false);
    setStep(4);
  };

  const handleClose = () => {
    setMethod(null);
    setStep(1);
    setAmount(prefilledAmount);
    setFile(null);
    onOpenChange(false);
  };

  const goToMethod = (m) => {
    setMethod(m);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {method === "card" ? (
              <CreditCard className="w-5 h-5 text-primary" />
            ) : (
              <QrCode className="w-5 h-5 text-primary" />
            )}
            {method === "card" ? "Pagar com Cartão" : method === "pix" ? "Pagar via PIX" : "Escolha o pagamento"}
          </DialogTitle>
        </DialogHeader>

        {/* Escolha do método */}
        {!method && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">Como deseja pagar?</p>

            <button
              onClick={() => goToMethod("pix")}
              className="w-full flex items-center gap-4 p-4 bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 rounded-xl transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">PIX</p>
                <p className="text-xs text-muted-foreground">Sem taxas adicionais</p>
              </div>
            </button>

            <button
              onClick={() => goToMethod("card")}
              className="w-full flex items-center gap-4 p-4 bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 rounded-xl transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Cartão de Crédito</p>
                <p className="text-xs text-muted-foreground">+ R$ {CARD_FEE.toFixed(2)} de tarifa · via Mercado Pago</p>
              </div>
            </button>
          </div>
        )}

        {/* ===== CARTÃO ===== */}
        {method === "card" && step === 1 && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">Informe o valor do item/ingresso:</p>
            <div className="space-y-1.5">
              <Label>Valor do item (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border rounded-xl text-lg font-heading"
              />
            </div>

            {parsedAmount > 0 && (
              <div className="bg-secondary/60 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Valor do item</span>
                  <span>R$ {parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tarifa cartão</span>
                  <span>+ R$ {CARD_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5">
                  <span>Total a pagar</span>
                  <span className="text-primary">R$ {cardTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <a
              href={MP_LINK}
              target="_blank"
              rel="noreferrer"
              className={`block ${parsedAmount <= 0 ? "pointer-events-none opacity-50" : ""}`}
            >
              <Button className="w-full rounded-xl gap-2" disabled={parsedAmount <= 0}>
                <ExternalLink className="w-4 h-4" />
                Pagar R$ {parsedAmount > 0 ? cardTotal.toFixed(2) : "0,00"} no Mercado Pago
              </Button>
            </a>

            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para o Mercado Pago para concluir o pagamento com segurança.
            </p>

            <button onClick={() => setMethod(null)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </div>
        )}

        {/* ===== PIX: Step 1 — Valor ===== */}
        {method === "pix" && step === 1 && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">Informe o valor que deseja pagar:</p>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border rounded-xl text-lg font-heading"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => setStep(2)}
              disabled={!amount || parsedAmount <= 0}
            >
              Continuar
            </Button>
            <button onClick={() => setMethod(null)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </div>
        )}

        {/* ===== PIX: Step 2 — Dados PIX ===== */}
        {method === "pix" && step === 2 && (
          <div className="space-y-4 pt-1">
            <div className="bg-secondary/60 rounded-xl p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Chave PIX (CPF)</p>
              <p className="font-heading font-bold text-2xl text-primary tracking-widest">{PIX_KEY}</p>
              <p className="text-xs text-muted-foreground">Festas Fusion</p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="font-heading font-bold text-xl text-primary">
                R$ {parsedAmount.toFixed(2)}
              </p>
            </div>

            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleCopyPix}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Chave copiada!" : "Copiar chave PIX"}
            </Button>

            <Button className="w-full rounded-xl" onClick={() => setStep(3)}>
              Já paguei, enviar comprovante
            </Button>
          </div>
        )}

        {/* ===== PIX: Step 3 — Upload ===== */}
        {method === "pix" && step === 3 && (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Envie o print ou foto do comprovante de <strong className="text-foreground">R$ {parsedAmount.toFixed(2)}</strong>.
            </p>
            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              }`}>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm text-primary font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <Button className="w-full rounded-xl" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Enviando..." : "Enviar comprovante"}
            </Button>
          </div>
        )}

        {/* ===== Sucesso PIX ===== */}
        {method === "pix" && step === 4 && (
          <div className="space-y-4 pt-1 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-foreground">Comprovante enviado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seu pagamento está sendo analisado. Assim que confirmado, o valor será baixado da sua conta.
              </p>
            </div>
            <Button className="w-full rounded-xl" onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}