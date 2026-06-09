import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Ingreso al sistema
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            SaaS Clínica Estética
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
