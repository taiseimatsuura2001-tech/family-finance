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
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
  "#EC4899", "#F43F5E",
];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    color: COLORS[0],
  });

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", activeTab],
    queryFn: () => api.getCategories({ type: activeTab }),
  });

  const categories = categoriesData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "作成完了",
        description: "カテゴリーを作成しました",
        className: "bg-green-50 border-green-200",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: "", color: COLORS[0] });
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
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "更新完了",
        description: "カテゴリーを更新しました",
        className: "bg-green-50 border-green-200",
      });
      setEditingCategory(null);
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
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "削除完了",
        description: "カテゴリーを削除しました",
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
      color: formData.color,
      type: activeTab,
    });
  };

  const handleUpdate = () => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: {
          name: formData.name,
          color: formData.color,
        },
      });
    }
  };

  const openAddDialog = () => {
    setFormData({ name: "", color: COLORS[0] });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (category: any) => {
    setFormData({
      name: category.name,
      color: category.color || COLORS[0],
    });
    setEditingCategory(category);
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
          <h1 className="text-2xl font-bold">カテゴリー管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            収入・支出のカテゴリーを管理
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "EXPENSE"
              ? "border-b-2 border-red-500 text-red-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          支出カテゴリー
        </button>
        <button
          onClick={() => setActiveTab("INCOME")}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "INCOME"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          収入カテゴリー
        </button>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={openAddDialog} className="gap-1.5">
          <Plus className="h-3 w-3" />
          カテゴリーを追加
        </Button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: any) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-sm">{category.name}</CardTitle>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(category.id)}
                      className="hover:text-red-600 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "カテゴリーを編集" : "カテゴリーを追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">カテゴリー名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: 食費"
              />
            </div>
            <div>
              <Label>カラー</Label>
              <div className="grid grid-cols-9 gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? "border-gray-800 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingCategory(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={editingCategory ? handleUpdate : handleCreate}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このカテゴリーを削除すると、使用できなくなります。
              既存の取引には影響しません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
