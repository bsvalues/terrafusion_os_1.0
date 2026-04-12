import React, { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { APP_NAME } from "@/data/constants";
import UserManagement from "@/components/dashboard/UserManagement";

export default function UsersPage() {
  useEffect(() => {
    document.title = `User Management | ${APP_NAME}`;
  }, []);

  return (
    <MainLayout pageTitle="User Management" pageDescription="Manage user accounts, roles, and permissions">
      <UserManagement />
    </MainLayout>
  );
}