import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientNav } from "@/components/client/ClientNav"

export default async function ClientLayout({
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
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "client") {
    redirect("/admin/dashboard") // si es admin lo mandamos a su panel
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <ClientNav userName={profile.full_name} />
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
