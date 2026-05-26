const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PartySelector from "@/components/PartySelector";
import EmptyState from "@/components/EmptyState";
import { TASK_CATEGORIES } from "@/lib/partyThemes";

const PRIORITIES = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700" },
  baixa: { label: "Baixa", color: "bg-green-100 text-green-700" },
};

export default function Tasks() {
  const [selectedParty, setSelectedParty] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("outro");
  const [newPriority, setNewPriority] = useState("media");
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => db.entities.Party.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", selectedParty],
    queryFn: () =>
      selectedParty
        ? db.entities.Task.filter({ party_id: selectedParty })
        : db.entities.Task.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTask("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleAdd = () => {
    if (!newTask.trim() || !selectedParty) return;
    createMutation.mutate({
      party_id: selectedParty,
      title: newTask,
      category: newCategory,
      priority: newPriority,
      done: false,
    });
  };

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">✅ Checklist</h1>

      <PartySelector
        parties={parties}
        selectedPartyId={selectedParty}
        onSelect={setSelectedParty}
        className="w-full"
      />

      {selectedParty && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nova tarefa..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} size="icon" className="shrink-0 rounded-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedParty ? (
        <EmptyState
          icon="📋"
          title="Selecione uma festa"
          description="Escolha uma festa acima para ver e gerenciar as tarefas"
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Sem tarefas"
          description="Adicione tarefas no campo acima"
        />
      ) : (
        <div className="space-y-6">
          {pendingTasks.length > 0 && (
            <section>
              <h2 className="font-heading text-sm font-bold text-muted-foreground mb-3">
                Pendentes ({pendingTasks.length})
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => updateMutation.mutate({ id: task.id, data: { done: !task.done } })}
                      onDelete={() => deleteMutation.mutate(task.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
          {doneTasks.length > 0 && (
            <section>
              <h2 className="font-heading text-sm font-bold text-muted-foreground mb-3">
                Concluídas ({doneTasks.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {doneTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => updateMutation.mutate({ id: task.id, data: { done: !task.done } })}
                    onDelete={() => deleteMutation.mutate(task.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  const cat = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.outro;
  const pri = PRIORITIES[task.priority] || PRIORITIES.media;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
    >
      <Card className="border-none shadow-sm">
        <CardContent className="p-3 flex items-center gap-3">
          <Checkbox checked={task.done} onCheckedChange={onToggle} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {cat.emoji} {cat.label}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 border-none ${pri.color}`}>
                {pri.label}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}