"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className={className}
      onClick={() => void handleLogout()}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
