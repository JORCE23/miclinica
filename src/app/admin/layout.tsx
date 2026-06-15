import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (profile?.role === "client") {
    redirect("/client/dashboard")
  }

  let permissions = null
  if (profile?.role === "staff") {
    const { data: perms } = await supabase
      .from("staff_permissions")
      .select("*")
      .eq("profile_id", user.id)
      .single()
    permissions = perms
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F0F3F7]">
      <AdminSidebar profile={profile} permissions={permissions} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader profile={profile} />
        <main className="flex-1 p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
