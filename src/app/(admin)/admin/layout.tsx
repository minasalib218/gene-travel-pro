import { redirect } from "next/navigation";
import { isVerifiedAdmin } from "@/lib/admin/verified";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isVerifiedAdmin())) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
