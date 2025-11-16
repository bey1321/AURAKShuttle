"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from "./ui";

interface ConfirmDeleteDialogProps {
  open: boolean;
  /** The title of the dialog, e.g. "Delete Bus" or "Delete Driver" */
  title: string;
  /** The custom message shown inside the dialog, e.g. "Are you sure you want to delete bus RAK-2?" */
  message: string;
  /** Optional custom label for the confirm button (default = "Delete") */
  confirmLabel?: string;
  /** Called when the user confirms deletion */
  onConfirm: () => void;
  /** Called when the dialog is closed or canceled */
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground">{message}</p>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
