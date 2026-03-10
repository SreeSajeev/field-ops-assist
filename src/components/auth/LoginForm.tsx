import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * Login only — no open signup. Users are created by Super Admin or Organisation Admin.
 */
export function LoginForm() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  /* =========================
     HANDLERS
  ========================= */

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    const { error } = await signIn(email ?? '', password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">

      {/* ================= LEFT PANEL ================= */}
      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3b124d] via-[#4a1659] to-[#5a1a6d] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-1/4 right-0 w-96 h-96 pointer-events-none rounded-full blur-3xl" style={{ background: "radial-gradient(ellipse, hsl(32 95% 52% / 0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 pointer-events-none rounded-full blur-3xl" style={{ background: "radial-gradient(ellipse, hsl(285 55% 55% / 0.08) 0%, transparent 70%)" }} />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/sahaya-logo.png"
            alt="Sahaya Logo"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold">Sahaya</h1>
            <p className="text-sm tracking-wide text-orange-300">
              Service Operations Platform
            </p>
          </div>
        </div>

        {/* Pitch */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">
            Structured Field Operations,
            <br />
            <span className="text-orange-300">
              Powered by Proof & Accountability
            </span>
          </h2>

          <p className="text-lg text-white/80">
            Sahaya connects service teams, field executives,
            and customers through a secure, token-driven workflow
            with verified proof at every stage.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Mail,
                text: 'Automatic ticket creation from inbound emails',
              },
              {
                icon: Truck,
                text: 'Token-based field executive coordination',
              },
              {
                icon: CheckCircle,
                text: 'Verified on-site & resolution proof workflow',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/10 p-4 rounded-xl"
              >
                <item.icon className="h-5 w-5 text-orange-300" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100/80 p-6">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(hsl(285 45% 45% / 0.04) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <Card className="relative z-10 w-full max-w-md border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4 flex flex-col items-center">
              <img
                src="/sahaya-logo.png"
                alt="Sahaya"
                className="h-12"
              />
            </div>
            <CardTitle className="text-2xl">
              Welcome to Sahaya
            </CardTitle>
            <CardDescription>
              Sign in with your email and password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="relative z-10 flex flex-col items-center mt-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Powered by
          </p>
          <img
            src="/pariskq-logo.png"
            alt="Pariskq"
            className="h-10 w-auto mt-2"
          />
        </div>
      </div>
    </div>
  );
}
