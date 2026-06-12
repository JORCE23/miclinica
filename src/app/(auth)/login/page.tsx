import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center flex flex-col items-center">
          <img src="/logo-medique-simbolo.png" alt="Medique Logo" className="h-28 w-auto max-w-full object-contain mb-6" />
          
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Ingreso al sistema
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
