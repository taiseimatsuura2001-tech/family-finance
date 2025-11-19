"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface ViewingUserContextType {
  viewUserId: string;
  setViewUserId: (userId: string) => void;
  isViewingOther: boolean;
  resetToCurrentUser: () => void;
}

const ViewingUserContext = createContext<ViewingUserContextType | undefined>(undefined);

export function ViewingUserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [viewUserId, setViewUserId] = useState<string>("");

  const currentUserId = session?.user?.id || "";

  // isViewingOther: viewUserIdが設定されていて、かつ現在のユーザーIDと異なる場合
  // currentUserIdが空の場合（セッション未ロード）でもviewUserIdが設定されていれば閲覧モード
  const isViewingOther = !!viewUserId && (currentUserId === "" || viewUserId !== currentUserId);

  const handleSetViewUserId = (userId: string) => {
    // 自分自身を選択した場合は空文字列にリセット（閲覧モード解除）
    if (userId === currentUserId) {
      setViewUserId("");
    } else {
      setViewUserId(userId);
    }
  };

  const resetToCurrentUser = () => {
    setViewUserId("");
  };

  return (
    <ViewingUserContext.Provider
      value={{
        viewUserId,
        setViewUserId: handleSetViewUserId,
        isViewingOther,
        resetToCurrentUser,
      }}
    >
      {children}
    </ViewingUserContext.Provider>
  );
}

export function useViewingUser() {
  const context = useContext(ViewingUserContext);
  if (context === undefined) {
    throw new Error("useViewingUser must be used within a ViewingUserProvider");
  }
  return context;
}
