"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui";
import { Edit, Trash2, Plus } from "lucide-react";
import { getTerminals } from "../../../data/database";
import { Terminal } from "../../../data/types";
import { adminAPI } from "../../../lib/api";
import ConfirmDeleteDialog from "../../ConfirmDeleteDialog";

export default function ManageTerminal() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [formData, setFormData] = useState<{
    terminalName: string;
    city: string;
  }>({
    terminalName: "",
    city: "",
  });
  const [terminalToDelete, setTerminalToDelete] = useState<Terminal | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // Fetch terminals on mount
  useEffect(() => {
    const fetchTerminals = async () => {
      try {
        setLoading(true);
        const data = await getTerminals();
        setTerminals(data);
      } catch (error) {
        console.error("Error fetching terminals:", error);
        alert("Failed to load terminals. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTerminals();
  }, []);

  const openAddDialog = () => {
    setFormData({ terminalName: "", city: "" });
    setEditingTerminal(null);
    setShowDialog(true);
  };

  const openEditDialog = (terminal: Terminal) => {
    setFormData({
      terminalName: terminal.terminalName || terminal.terminal || "",
      city: terminal.city || "",
    });
    setEditingTerminal(terminal);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.terminalName || !formData.city) return;

    try {
      setSaving(true);
      if (editingTerminal) {
        // Update terminal - Note: Backend doesn't have update endpoint, so we'll show an error
        alert(
          "Terminal update functionality is not available in the backend. Please delete and recreate the terminal."
        );
      } else {
        // Create new terminal
        await adminAPI.createTerminal({
          terminalName: formData.terminalName,
          city: formData.city,
        });

        // Refresh terminals list
        const data = await getTerminals();
        setTerminals(data);
      }

      setShowDialog(false);
      setFormData({ terminalName: "", city: "" });
      setEditingTerminal(null);
    } catch (error) {
      console.error("Error saving terminal:", error);
      alert("Failed to save terminal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!terminalToDelete) return;

    try {
      // Note: Backend doesn't have delete terminal endpoint
      // For now, we'll just remove from local state
      // In a real implementation, you would call: await adminAPI.deleteTerminal(terminalToDelete.id);
      alert(
        "Terminal deletion is not available in the backend API. This action would require backend implementation."
      );
      // setTerminals(terminals.filter((t) => t.id !== terminalToDelete.id));
      setTerminalToDelete(null);
    } catch (error) {
      console.error("Error deleting terminal:", error);
      alert("Failed to delete terminal. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manage Terminals</h1>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" /> Add Terminal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terminal List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">
              Loading terminals...
            </p>
          ) : terminals.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No terminals available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terminal Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminals.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.terminalName || t.terminal}</TableCell>
                    <TableCell>{t.city}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(t)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setTerminalToDelete(t)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTerminal !== null ? "Edit Terminal" : "Add Terminal"}
            </DialogTitle>
            <DialogDescription>
              {editingTerminal !== null
                ? "Update the terminal information."
                : "Add a new terminal to the list."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <Label>Terminal Name</Label>
              <Input
                value={formData.terminalName}
                onChange={(e) =>
                  setFormData({ ...formData, terminalName: e.target.value })
                }
                placeholder="e.g., Main Terminal"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="e.g., Dubai"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : editingTerminal
                ? "Save Changes"
                : "Add Terminal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Confirm Delete Dialog */}
      {terminalToDelete && (
        <ConfirmDeleteDialog
          open={!!terminalToDelete}
          title="Delete Terminal"
          message={`Are you sure you want to delete terminal "${
            terminalToDelete.terminalName || terminalToDelete.terminal
          }" (${terminalToDelete.city})?`}
          confirmLabel="Delete Terminal"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setTerminalToDelete(null)}
        />
      )}
    </div>
  );
}
