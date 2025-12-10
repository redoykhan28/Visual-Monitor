'use client';

import { useState } from "react";
import { MoreHorizontal, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { deleteWebsite, deletePage, editWebsite, editPage } from "@/app/actions";

interface ItemActionsProps {
  id: number;
  type: 'project' | 'page';
  currentName: string; // The name or path
}

export default function ItemActions({ id, type, currentName }: ItemActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(currentName);

  // HANDLE DELETE
  const handleDelete = async () => {
    setLoading(true);
    try {
      if (type === 'project') await deleteWebsite(id);
      else await deletePage(id);
      toast.success(`${type === 'project' ? 'Project' : 'Page'} deleted.`);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete.");
    } finally {
      setLoading(false);
    }
  };

  // HANDLE EDIT
  const handleEdit = async () => {
    setLoading(true);
    try {
      if (type === 'project') await editWebsite(id, newName);
      else await editPage(id, newName);
      toast.success("Updated successfully.");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. The Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 2. Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {type === 'project' ? 'Project Name' : 'Page Path'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              placeholder={type === 'project' ? "Project Name" : "/about"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete this 
            {type === 'project' ? ' project and all its monitored pages.' : ' monitored page.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}