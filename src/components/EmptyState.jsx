import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="font-heading text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2 rounded-full px-6">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}