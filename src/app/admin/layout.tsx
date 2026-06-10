import { AdminTopNav } from "@/components/admin/AdminTopNav"
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-background">
      <AdminTopNav profile={profile} />
      <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
