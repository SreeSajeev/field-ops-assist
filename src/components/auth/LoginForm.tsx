import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Truck, Mail, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

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

    const { error } = await signUp(email, password, name);
    
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created',
        description: 'You can now sign in with your credentials.',
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12"
           style={{ background: 'linear-gradient(135deg, hsl(285 45% 22%), hsl(285 55% 32%))' }}>
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl logo-glow"
                 style={{ background: 'linear-gradient(135deg, hsl(32 95% 48%), hsl(32 95% 55%))' }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">LogiCRM</h1>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(32 95% 60%)' }}>by Pariskq</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Clear Connections,<br />
              <span className="text-gradient-accent" style={{ color: 'hsl(32 95% 60%)' }}>Total Control</span>
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-md">
              Transform your logistics operations with automated ticket management and intelligent field service coordination.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: Truck, title: 'Field Operations', desc: 'WhatsApp-driven field executive management' },
              { icon: Mail, title: 'Email Automation', desc: 'Intelligent email parsing and ticket creation' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl" 
                   style={{ background: 'hsl(285 40% 28% / 0.5)' }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                     style={{ background: 'hsl(32 95% 52% / 0.2)' }}>
                  <feature.icon className="h-5 w-5" style={{ color: 'hsl(32 95% 60%)' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">
          © 2025 Pariskq. All rights reserved.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                 style={{ background: 'linear-gradient(135deg, hsl(285 45% 30%), hsl(285 45% 38%))' }}>
              <Shield className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="font-medium">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 btn-purple"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
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
