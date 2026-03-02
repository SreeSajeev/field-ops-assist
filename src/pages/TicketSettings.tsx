import { useState, useEffect } from "react";
import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sliders, Clock, ListOrdered, Plus, X, RefreshCw } from "lucide-react";

const CONFIG_KEY_PREFIX = "org_";
const CONFIG_KEY_SUFFIX = "_ticket_config";

export interface OrgTicketConfig {
  categories: string[];
  issueTypes: string[];
  sla: {
    assignmentHours: number;
    onsiteHours: number;
    resolutionHours: number;
  };
}

const defaultConfig: OrgTicketConfig = {
  categories: [],
  issueTypes: [],
  sla: {
    assignmentHours: 4,
    onsiteHours: 24,
    resolutionHours: 48,
  },
};

function getConfigKey(organisationId: string): string {
  return `${CONFIG_KEY_PREFIX}${organisationId}${CONFIG_KEY_SUFFIX}`;
}

export default function TicketSettings() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const organisationId = userProfile?.organisation_id ?? null;
  const isAdmin = userProfile?.role === "ADMIN";

  const [localConfig, setLocalConfig] = useState<OrgTicketConfig>(defaultConfig);
  const [newCategory, setNewCategory] = useState("");
  const [newIssueType, setNewIssueType] = useState("");

  const configKey = organisationId ? getConfigKey(organisationId) : null;

  const { data: configRow, isLoading } = useQuery({
    queryKey: ["configurations", configKey],
    enabled: Boolean(configKey),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configurations")
        .select("key, value")
        .eq("key", configKey!)
        .maybeSingle();
      if (error) throw error;
      return data as { key: string; value: OrgTicketConfig | null } | null;
    },
  });

  useEffect(() => {
    if (configRow?.value && typeof configRow.value === "object") {
      const v = configRow.value as OrgTicketConfig;
      setLocalConfig({
        categories: Array.isArray(v.categories) ? v.categories : [],
        issueTypes: Array.isArray(v.issueTypes) ? v.issueTypes : [],
        sla: {
          assignmentHours: typeof v.sla?.assignmentHours === "number" ? v.sla.assignmentHours : defaultConfig.sla.assignmentHours,
          onsiteHours: typeof v.sla?.onsiteHours === "number" ? v.sla.onsiteHours : defaultConfig.sla.onsiteHours,
          resolutionHours: typeof v.sla?.resolutionHours === "number" ? v.sla.resolutionHours : defaultConfig.sla.resolutionHours,
        },
      });
    } else if (!configKey || !isLoading) {
      setLocalConfig(defaultConfig);
    }
  }, [configKey, configRow, isLoading]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: OrgTicketConfig) => {
      if (!configKey) throw new Error("No organisation");
      const { data: existing } = await supabase.from("configurations").select("key").eq("key", configKey).maybeSingle();
      const value = payload as unknown as Record<string, unknown>;
      const updated_at = new Date().toISOString();
      if (existing) {
        const { error } = await supabase.from("configurations").update({ value, updated_at }).eq("key", configKey);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("configurations").insert({ key: configKey, value, updated_at });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configurations", configKey] });
      toast({ title: "Saved", description: "Ticket settings updated." });
    },
    onError: (err) => {
      toast({ title: "Failed to save", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });

  const handleSave = () => upsertMutation.mutate(localConfig);

  const addCategory = () => {
    const t = newCategory.trim();
    if (!t) return;
    if (localConfig.categories.includes(t)) {
      setNewCategory("");
      return;
    }
    setLocalConfig((c) => ({ ...c, categories: [...c.categories, t].sort() }));
    setNewCategory("");
  };

  const removeCategory = (item: string) => {
    setLocalConfig((c) => ({ ...c, categories: c.categories.filter((x) => x !== item) }));
  };

  const addIssueType = () => {
    const t = newIssueType.trim();
    if (!t) return;
    if (localConfig.issueTypes.includes(t)) {
      setNewIssueType("");
      return;
    }
    setLocalConfig((c) => ({ ...c, issueTypes: [...c.issueTypes, t].sort() }));
    setNewIssueType("");
  };

  const removeIssueType = (item: string) => {
    setLocalConfig((c) => ({ ...c, issueTypes: c.issueTypes.filter((x) => x !== item) }));
  };

  if (!organisationId) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <p className="text-muted-foreground">Organisation context required.</p>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <p className="text-muted-foreground">Tenant Admin access required to configure ticket settings.</p>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  return (
    <AppLayoutNew>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary">
                <Sliders className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ticket Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Categories, issue types, and SLA hours for your organisation
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${upsertMutation.isPending ? "animate-spin" : ""}`} />
              {upsertMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListOrdered className="h-5 w-5" />
                    Categories & Issue Types
                  </CardTitle>
                  <CardDescription>Add or remove categories and issue types for tickets in your organisation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {localConfig.categories.map((item) => (
                        <Badge key={item} variant="secondary" className="gap-1">
                          {item}
                          <button type="button" onClick={() => removeCategory(item)} className="ml-1 rounded hover:bg-muted" aria-label={`Remove ${item}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {localConfig.issueTypes.map((item) => (
                        <Badge key={item} variant="secondary" className="gap-1">
                          {item}
                          <button type="button" onClick={() => removeIssueType(item)} className="ml-1 rounded hover:bg-muted" aria-label={`Remove ${item}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newIssueType}
                        onChange={(e) => setNewIssueType(e.target.value)}
                        placeholder="New issue type"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIssueType())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addIssueType}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    SLA Settings
                  </CardTitle>
                  <CardDescription>Configure SLA targets (hours) for assignment, on-site, and resolution.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="sla-assignment">Assignment (hours)</Label>
                    <Input
                      id="sla-assignment"
                      type="number"
                      min={1}
                      value={localConfig.sla.assignmentHours}
                      onChange={(e) =>
                        setLocalConfig((c) => ({
                          ...c,
                          sla: { ...c.sla, assignmentHours: Math.max(0, parseInt(e.target.value, 10) || 0) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sla-onsite">On-site (hours)</Label>
                    <Input
                      id="sla-onsite"
                      type="number"
                      min={1}
                      value={localConfig.sla.onsiteHours}
                      onChange={(e) =>
                        setLocalConfig((c) => ({
                          ...c,
                          sla: { ...c.sla, onsiteHours: Math.max(0, parseInt(e.target.value, 10) || 0) },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sla-resolution">Resolution (hours)</Label>
                    <Input
                      id="sla-resolution"
                      type="number"
                      min={1}
                      value={localConfig.sla.resolutionHours}
                      onChange={(e) =>
                        setLocalConfig((c) => ({
                          ...c,
                          sla: { ...c.sla, resolutionHours: Math.max(0, parseInt(e.target.value, 10) || 0) },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayoutNew>
  );
}
