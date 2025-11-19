"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";

export interface FilterValues {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: string;
  vendorId?: string;
  keyword?: string;
}

interface TransactionFiltersProps {
  categories: any[];
  vendors?: any[];
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onClear: () => void;
}

export function TransactionFilters({
  categories,
  vendors = [],
  filters,
  onFilterChange,
  onClear,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof FilterValues, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ""
  );

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ""
  ).length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {/* Header with Toggle - entire area is clickable */}
        <div
          className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">絞り込み検索</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {activeFilterCount}件適用中
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                閉じる
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                開く
              </>
            )}
          </div>
        </div>

        {/* Filter Content */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Keyword Search */}
            <div>
              <Label htmlFor="keyword" className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4" />
                キーワード検索
              </Label>
              <Input
                id="keyword"
                type="text"
                placeholder="説明文、支払先などで検索"
                value={filters.keyword || ""}
                onChange={(e) => handleChange("keyword", e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">
                  開始日
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block">
                  終了日
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount" className="mb-2 block">
                  最小金額
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ¥
                  </span>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder=""
                    className="pl-8"
                    value={filters.minAmount ?? ""}
                    onChange={(e) =>
                      handleChange("minAmount", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxAmount" className="mb-2 block">
                  最大金額
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ¥
                  </span>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder=""
                    className="pl-8"
                    value={filters.maxAmount ?? ""}
                    onChange={(e) =>
                      handleChange("maxAmount", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Category and Vendor Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryId" className="mb-2 block">
                  カテゴリー
                </Label>
                <select
                  id="categoryId"
                  value={filters.categoryId || ""}
                  onChange={(e) => handleChange("categoryId", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべてのカテゴリー</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {vendors.length > 0 && (
                <div>
                  <Label htmlFor="vendorId" className="mb-2 block">
                    支払先/支払元
                  </Label>
                  <select
                    id="vendorId"
                    value={filters.vendorId || ""}
                    onChange={(e) => handleChange("vendorId", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">すべての支払先</option>
                    {vendors.map((vendor: any) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClear}
                disabled={!hasActiveFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                クリア
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Summary (when collapsed) */}
        {!isExpanded && hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.keyword && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                キーワード: {filters.keyword}
                <button
                  onClick={() => handleChange("keyword", "")}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                開始: {filters.startDate}
                <button
                  onClick={() => handleChange("startDate", "")}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                終了: {filters.endDate}
                <button
                  onClick={() => handleChange("endDate", "")}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.categoryId && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                カテゴリー:{" "}
                {categories.find((c) => c.id === filters.categoryId)?.name || "不明"}
                <button
                  onClick={() => handleChange("categoryId", "")}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.vendorId && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                支払先:{" "}
                {vendors.find((v) => v.id === filters.vendorId)?.name || "不明"}
                <button
                  onClick={() => handleChange("vendorId", "")}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                金額: {filters.minAmount ? `¥${filters.minAmount.toLocaleString()}` : "0"}
                {" ~ "}
                {filters.maxAmount ? `¥${filters.maxAmount.toLocaleString()}` : "上限なし"}
                <button
                  onClick={() => {
                    handleChange("minAmount", undefined);
                    handleChange("maxAmount", undefined);
                  }}
                  className="hover:text-gray-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
