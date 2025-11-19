"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, ArrowLeft, Building } from "lucide-react";
import Link from "next/link";

const VENDOR_TYPES = [
  { value: "GENERAL", label: "一般" },
  { value: "STORE", label: "店舗" },
  { value: "RESTAURANT", label: "飲食店" },
  { value: "UTILITY", label: "公共料金" },
  { value: "MEDICAL", label: "医療" },
  { value: "ENTERTAINMENT", label: "娯楽" },
  { value: "OTHER", label: "その他" },
];

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "GENERAL",
  });

  // Fetch vendors
  const { data: vendorsData, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors(),
  });

  const vendors = vendorsData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "作成完了",
        description: "支払先を作成しました",
        className: "bg-green-50 border-green-200",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", type: "GENERAL" });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "作成に失敗しました",
        className: "bg-red-50 border-red-200",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "更新完了",
        description: "支払先を更新しました",
        className: "bg-green-50 border-green-200",
      });
      setEditingVendor(null);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        className: "bg-red-50 border-red-200",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "削除完了",
        description: "支払先を削除しました",
        className: "bg-green-50 border-green-200",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        className: "bg-red-50 border-red-200",
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
    });
  };

  const handleUpdate = () => {
    if (editingVendor) {
      updateMutation.mutate({
        id: editingVendor.id,
        data: {
          name: formData.name,
          type: formData.type,
        },
      });
    }
  };

  const openAddDialog = () => {
    setFormData({ name: "", type: "GENERAL" });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (vendor: any) => {
    setFormData({
      name: vendor.name,
      type: vendor.type || "GENERAL",
    });
    setEditingVendor(vendor);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3 w-3" />
            設定に戻る
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">支払先管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            支払先・支払元を管理
          </p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openAddDialog} className="gap-1.5">
          <Plus className="h-3 w-3" />
          支払先を追加
        </Button>
      </div>

      {/* Vendors List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor: any) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-sm">{vendor.name}</CardTitle>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(vendor)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(vendor.id)}
                      className="hover:text-red-600 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="text-xs text-muted-foreground">
                  {VENDOR_TYPES.find((t) => t.value === vendor.type)?.label || "一般"}
                </div>
              </CardContent>
            </Card>
          ))}
          {vendors.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              支払先が登録されていません
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || !!editingVendor}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingVendor(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "支払先を編集" : "支払先を追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">支払先名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: ○○スーパー、△△電力"
              />
            </div>
            <div>
              <Label htmlFor="type">種別</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VENDOR_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingVendor(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={editingVendor ? handleUpdate : handleCreate}
              disabled={
                !formData.name || createMutation.isPending || updateMutation.isPending
              }
            >
              {editingVendor ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>支払先を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。本当に削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate(deletingId);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
