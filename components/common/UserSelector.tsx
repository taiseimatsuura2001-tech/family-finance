"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { useViewingUser } from "@/components/providers/ViewingUserProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Eye } from "lucide-react";

export function UserSelector() {
  const { data: session } = useSession();
  const { viewUserId, setViewUserId, isViewingOther } = useViewingUser();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  const users = usersData?.data || [];
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;

  // USER role can only view their own data, so don't show the selector
  if (currentUserRole === 'USER') {
    return null;
  }

  // ユーザーが1人以下またはデータ取得中は表示しない
  // ただし、ローディング中はスケルトン表示
  if (users.length <= 1 && !isLoading) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>表示ユーザー:</span>
      </div>
      {isLoading ? (
        <div className="w-[200px] h-10 bg-gray-100 rounded-md animate-pulse" />
      ) : (
        <Select value={viewUserId || currentUserId || ""} onValueChange={setViewUserId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email?.split("@")[0]}
                {user.id === currentUserId && " (自分)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {isViewingOther && (
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          <Eye className="h-3 w-3" />
          閲覧モード
        </div>
      )}
    </div>
  );
}
