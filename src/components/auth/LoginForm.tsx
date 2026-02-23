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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Mail,
  ArrowRight,
  Briefcase,
  CheckCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/types';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] =
    useState<UserRole>('STAFF');

  /* =========================
     HANDLERS
  ========================= */

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signUp(
      email,
      password,
      name,
      selectedRole
    );

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created',
        description: 'You can now sign in.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#3b124d] via-[#4a1659] to-[#5a1a6d] text-white">
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "linear-gradient(hsl(285 45% 55% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(285 45% 55% / 0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
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
      <div className="flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/80">
        <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage: "radial-gradient(hsl(285 45% 45% / 0.04) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <Card className="relative z-10 w-full max-w-md border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)] transition-shadow duration-300">
          <CardHeader className="text-center">
            <div className="lg:hidden flex flex-col items-center mb-4">
              <img
                src="/sahaya-logo.png"
                alt="Sahaya"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Powered by
              </p>
              <img
                src="/pariskq-logo.png"
                alt="Pariskq"
                className="h-6 mt-1"
              />
            </div>
            <CardTitle className="text-2xl">
              Welcome to Sahaya
            </CardTitle>
            <CardDescription>
              Sign in to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" required />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input name="name" placeholder="Full Name" required />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                  />

                  <Select
                    value={selectedRole}
                    onValueChange={(v) =>
                      setSelectedRole(v as UserRole)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">
                        <Briefcase className="inline h-4 w-4 mr-2" />
                        Service Staff
                      </SelectItem>
                      <SelectItem value="FIELD_EXECUTIVE">
                        <Truck className="inline h-4 w-4 mr-2" />
                        Field Executive
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
