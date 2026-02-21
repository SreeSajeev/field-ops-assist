import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  RefreshCw, 
  Clock,
  Mail,
  Shield,
  Zap,
  Database,
  Lock,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigItem {
  key: string;
  value: any;
  updated_at: string;
}

function ConfigSection({ 
  title, 
  description, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ConfigRow({ 
  label, 
  value, 
  type = 'text',
  systemControlled = false,
}: { 
  label: string; 
  value: string | number | boolean; 
  type?: 'text' | 'boolean' | 'number' | 'time';
  systemControlled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        {systemControlled && (
          <Badge variant="outline" className="text-xs bg-muted">
            <Lock className="h-2.5 w-2.5 mr-1" />
            System
          </Badge>
        )}
      </div>
      <div>
        {type === 'boolean' ? (
          value ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
              <CheckCircle className="h-3 w-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Disabled
            </Badge>
          )
        ) : type === 'time' ? (
          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{value}</span>
        ) : (
          <span className="text-sm text-muted-foreground">{String(value)}</span>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: configs, isLoading, refetch } = useQuery({
    queryKey: ['configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configurations')
        .select('*');

      if (error) throw error;
      return data as ConfigItem[];
    },
  });

  // Parse config values
  const getConfig = (key: string, defaultValue: any = null) => {
    const config = configs?.find(c => c.key === key);
    return config?.value ?? defaultValue;
  };

  // Default SLA configuration
  const slaConfig = {
    assignment_sla_hours: getConfig('assignment_sla_hours', 4),
    onsite_sla_hours: getConfig('onsite_sla_hours', 24),
    resolution_sla_hours: getConfig('resolution_sla_hours', 48),
  };

  // Parsing configuration
  const parsingConfig = {
    auto_approve_threshold: getConfig('auto_approve_threshold', 95),
    needs_review_threshold: getConfig('needs_review_threshold', 80),
    enable_auto_parsing: getConfig('enable_auto_parsing', true),
  };

  // Email configuration
  const emailConfig = {
    postmark_enabled: getConfig('postmark_enabled', true),
    auto_reply_enabled: getConfig('auto_reply_enabled', false),
    support_email: getConfig('support_email', 'support@pariskq.in'),
  };

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-600 to-gray-800">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm">
                System configuration and operational parameters
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Read-Only Notice */}
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Read-Only View:</strong> Configuration changes require Super Admin privileges.
            Contact your system administrator to modify these settings.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading configuration...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* SLA Configuration */}
            <ConfigSection
              title="SLA Configuration"
              description="Service Level Agreement timers and deadlines"
              icon={Clock}
            >
              <ConfigRow 
                label="Assignment SLA" 
                value={`${slaConfig.assignment_sla_hours} hours`}
                type="time"
                systemControlled
              />
              <ConfigRow 
                label="On-Site SLA" 
                value={`${slaConfig.onsite_sla_hours} hours`}
                type="time"
                systemControlled
              />
              <ConfigRow 
                label="Resolution SLA" 
                value={`${slaConfig.resolution_sla_hours} hours`}
                type="time"
                systemControlled
              />
            </ConfigSection>

            {/* Parsing Configuration */}
            <ConfigSection
              title="Parsing Engine"
              description="Email parsing and confidence thresholds"
              icon={Zap}
            >
              <ConfigRow 
                label="Auto-Approve Threshold" 
                value={`≥ ${parsingConfig.auto_approve_threshold}%`}
                type="text"
                systemControlled
              />
              <ConfigRow 
                label="Needs Review Threshold" 
                value={`${parsingConfig.needs_review_threshold}% - ${parsingConfig.auto_approve_threshold - 1}%`}
                type="text"
                systemControlled
              />
              <ConfigRow 
                label="Draft Threshold" 
                value={`< ${parsingConfig.needs_review_threshold}%`}
                type="text"
                systemControlled
              />
              <ConfigRow 
                label="Auto-Parsing Enabled" 
                value={parsingConfig.enable_auto_parsing}
                type="boolean"
                systemControlled
              />
            </ConfigSection>

            {/* Email Configuration */}
            <ConfigSection
              title="Email Integration"
              description="Inbound email processing settings"
              icon={Mail}
            >
              <ConfigRow 
                label="Postmark Integration" 
                value={emailConfig.postmark_enabled}
                type="boolean"
                systemControlled
              />
              <ConfigRow 
                label="Auto-Reply Enabled" 
                value={emailConfig.auto_reply_enabled}
                type="boolean"
                systemControlled
              />
              <ConfigRow 
                label="Support Email" 
                value={emailConfig.support_email}
                type="text"
                systemControlled
              />
            </ConfigSection>

            {/* System Information */}
            <ConfigSection
              title="System Information"
              description="Platform and integration status"
              icon={Database}
            >
              <ConfigRow 
                label="Platform Version" 
                value="LogiCRM v1.0.0"
                type="text"
                systemControlled
              />
              <ConfigRow 
                label="Database Status" 
                value={true}
                type="boolean"
              />
              <ConfigRow 
                label="WhatsApp Gateway" 
                value={true}
                type="boolean"
              />
              <ConfigRow 
                label="Auth Provider" 
                value="Supabase Auth"
                type="text"
                systemControlled
              />
            </ConfigSection>

            {/* Security Settings */}
            <ConfigSection
              title="Security"
              description="Authentication and access control settings"
              icon={Shield}
            >
              <ConfigRow 
                label="Row Level Security" 
                value={true}
                type="boolean"
                systemControlled
              />
              <ConfigRow 
                label="Audit Logging" 
                value={true}
                type="boolean"
                systemControlled
              />
              <ConfigRow 
                label="Session Timeout" 
                value="24 hours"
                type="time"
                systemControlled
              />
              <ConfigRow 
                label="Token Expiry (FE Links)" 
                value="4 hours"
                type="time"
                systemControlled
              />
            </ConfigSection>
          </div>
        )}
      </div>
    </PageContainer>
    </AppLayoutNew>
  );
}
