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
  Shield,
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
      {/* ================= LEFT: BRAND / SALES ================= */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#3b124d] to-[#5a1a6d] text-white">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <img
            src="/pariskq-logo.png"
            alt="Pariskq Logo"
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold">Sahaya</h1>
            <p className="text-sm tracking-wide text-orange-300">
              by Pariskq
            </p>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-8 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight">
            End-to-End Complaint Resolution,
            <br />
            <span className="text-orange-300">
              Built for Real Operations
            </span>
          </h2>

          <p className="text-lg text-white/80">
            Sahaya is a secure, token-driven service workflow
            platform that connects service teams, field
            executives, and customers - with proof at every
            step.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Mail,
                text: 'Automatic ticket creation from emails',
              },
              {
                icon: Truck,
                text: 'Field Executive coordination with action tokens',
              },
              {
                icon: CheckCircle,
                text: 'Verified on-site and resolution proofs',
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

        <p className="text-xs text-white/40">
          © 2025 Pariskq. All rights reserved.
        </p>
      </div>

      {/* ================= RIGHT: AUTH ================= */}
      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <img
                src="/pariskq-logo.png"
                alt="Pariskq Logo"
                className="h-12"
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
      </div>
    </div>
  );
}
