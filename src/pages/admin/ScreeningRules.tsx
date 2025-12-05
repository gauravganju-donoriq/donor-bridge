import { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ScreeningRule {
  id: string;
  rule_type: string;
  rule_name: string;
  rule_key: string;
  rule_value: { value: number | boolean | string; operator: string };
  field_path: string;
  description: string | null;
  is_active: boolean;
  severity: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const FIELD_OPTIONS = [
  { value: "calculated_bmi", label: "BMI (calculated)" },
  { value: "calculated_age", label: "Age (calculated)" },
  { value: "has_blood_disorder", label: "Has Blood Disorder" },
  { value: "has_chronic_illness", label: "Has Chronic Illness" },
  { value: "had_surgery", label: "Had Surgery" },
  { value: "has_tattoos_piercings", label: "Has Tattoos/Piercings" },
  { value: "has_been_incarcerated", label: "Has Been Incarcerated" },
  { value: "has_traveled_internationally", label: "Has Traveled Internationally" },
  { value: "has_received_transfusion", label: "Has Received Transfusion" },
  { value: "has_been_pregnant", label: "Has Been Pregnant" },
  { value: "takes_medications", label: "Takes Medications" },
];

const OPERATOR_OPTIONS = [
  { value: "gt", label: "Greater than (>)" },
  { value: "gte", label: "Greater than or equal (≥)" },
  { value: "lt", label: "Less than (<)" },
  { value: "lte", label: "Less than or equal (≤)" },
  { value: "eq", label: "Equals (=)" },
  { value: "neq", label: "Not equals (≠)" },
];

const ScreeningRules = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [rules, setRules] = useState<ScreeningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ScreeningRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    rule_name: "",
    rule_key: "",
    rule_type: "soft_flag",
    field_path: "",
    operator: "eq",
    value: "",
    description: "",
    severity: "medium",
    is_active: true,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("screening_rules")
        .select("*")
        .order("rule_type")
        .order("display_order");

      if (error) throw error;
      setRules((data || []) as ScreeningRule[]);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast({
        title: "Error",
        description: "Failed to load screening rules.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (rule?: ScreeningRule) => {
    if (rule) {
      setSelectedRule(rule);
      setFormData({
        rule_name: rule.rule_name,
        rule_key: rule.rule_key,
        rule_type: rule.rule_type,
        field_path: rule.field_path,
        operator: rule.rule_value.operator,
        value: String(rule.rule_value.value),
        description: rule.description || "",
        severity: rule.severity,
        is_active: rule.is_active,
      });
    } else {
      setSelectedRule(null);
      setFormData({
        rule_name: "",
        rule_key: "",
        rule_type: "soft_flag",
        field_path: "",
        operator: "eq",
        value: "",
        description: "",
        severity: "medium",
        is_active: true,
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.rule_name || !formData.rule_key || !formData.field_path) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Parse value based on field type
      let parsedValue: number | boolean | string = formData.value;
      if (formData.value === "true") parsedValue = true;
      else if (formData.value === "false") parsedValue = false;
      else if (!isNaN(Number(formData.value))) parsedValue = Number(formData.value);

      const ruleData = {
        rule_name: formData.rule_name,
        rule_key: formData.rule_key,
        rule_type: formData.rule_type,
        field_path: formData.field_path,
        rule_value: { operator: formData.operator, value: parsedValue },
        description: formData.description || null,
        severity: formData.severity,
        is_active: formData.is_active,
      };

      if (selectedRule) {
        const { error } = await supabase
          .from("screening_rules")
          .update(ruleData)
          .eq("id", selectedRule.id);
        if (error) throw error;
        toast({ title: "Success", description: "Rule updated successfully." });
      } else {
        const { error } = await supabase
          .from("screening_rules")
          .insert([{ ...ruleData, display_order: rules.length + 1 }]);
        if (error) throw error;
        toast({ title: "Success", description: "Rule created successfully." });
      }

      setEditDialogOpen(false);
      fetchRules();
    } catch (error: unknown) {
      console.error("Error saving rule:", error);
      toast({
        title: "Error",
        description: error instanceof Error && error.message.includes("duplicate")
          ? "A rule with this key already exists."
          : "Failed to save rule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: ScreeningRule) => {
    try {
      const { error } = await supabase
        .from("screening_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;

      setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
      toast({
        title: rule.is_active ? "Rule Disabled" : "Rule Enabled",
        description: `"${rule.rule_name}" has been ${rule.is_active ? "disabled" : "enabled"}.`,
      });
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast({
        title: "Error",
        description: "Failed to update rule status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;

    try {
      const { error } = await supabase
        .from("screening_rules")
        .delete()
        .eq("id", selectedRule.id);

      if (error) throw error;

      toast({ title: "Success", description: "Rule deleted successfully." });
      setDeleteDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete rule.",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getRuleTypeBadge = (type: string) => {
    switch (type) {
      case "hard_disqualify":
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Hard Disqualify
          </Badge>
        );
      case "soft_flag":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Soft Flag
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const hardRules = rules.filter(r => r.rule_type === "hard_disqualify");
  const softRules = rules.filter(r => r.rule_type === "soft_flag");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Screening Rules</h1>
        {isAdmin && (
          <Button onClick={() => openEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How screening rules work:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Hard Disqualifiers:</strong> Automatically mark submissions as unsuitable</li>
              <li><strong>Soft Flags:</strong> Mark submissions for manual review</li>
              <li>Rules are applied when submissions are evaluated (automatic or manual)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Hard Disqualifiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-destructive" />
            Hard Disqualifiers
          </CardTitle>
          <CardDescription>
            Conditions that automatically disqualify a submission
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <RulesTable
            rules={hardRules}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={(rule) => { setSelectedRule(rule); setDeleteDialogOpen(true); }}
            onToggle={handleToggleActive}
            getSeverityBadge={getSeverityBadge}
            getRuleTypeBadge={getRuleTypeBadge}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {/* Soft Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Soft Flags
          </CardTitle>
          <CardDescription>
            Conditions that require manual review before approval
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <RulesTable
            rules={softRules}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={(rule) => { setSelectedRule(rule); setDeleteDialogOpen(true); }}
            onToggle={handleToggleActive}
            getSeverityBadge={getSeverityBadge}
            getRuleTypeBadge={getRuleTypeBadge}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
            <DialogDescription>
              {selectedRule ? "Modify the screening rule settings" : "Create a new screening rule"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name *</Label>
                <Input
                  id="rule_name"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g., Maximum BMI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule_key">Rule Key *</Label>
                <Input
                  id="rule_key"
                  value={formData.rule_key}
                  onChange={(e) => setFormData({ ...formData, rule_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="e.g., bmi_max"
                  disabled={!!selectedRule}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule_type">Rule Type *</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(v) => setFormData({ ...formData, rule_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard_disqualify">Hard Disqualify</SelectItem>
                    <SelectItem value="soft_flag">Soft Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({ ...formData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_path">Field to Check *</Label>
              <Select
                value={formData.field_path}
                onValueChange={(v) => setFormData({ ...formData, field_path: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operator">Condition *</Label>
                <Select
                  value={formData.operator}
                  onValueChange={(v) => setFormData({ ...formData, operator: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., 36 or true"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain why this rule exists..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label htmlFor="is_active">Rule is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : selectedRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRule?.rule_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Extracted table component
const RulesTable = ({
  rules,
  loading,
  onEdit,
  onDelete,
  onToggle,
  getSeverityBadge,
  getRuleTypeBadge,
  isAdmin,
}: {
  rules: ScreeningRule[];
  loading: boolean;
  onEdit: (rule: ScreeningRule) => void;
  onDelete: (rule: ScreeningRule) => void;
  onToggle: (rule: ScreeningRule) => void;
  getSeverityBadge: (severity: string) => JSX.Element;
  getRuleTypeBadge: (type: string) => JSX.Element;
  isAdmin: boolean;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]">Active</TableHead>
        <TableHead>Rule</TableHead>
        <TableHead className="hidden md:table-cell">Condition</TableHead>
        <TableHead className="hidden sm:table-cell">Severity</TableHead>
        {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-6 w-10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
            {isAdmin && <TableCell><Skeleton className="h-8 w-20" /></TableCell>}
          </TableRow>
        ))
      ) : rules.length === 0 ? (
        <TableRow>
          <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center text-muted-foreground">
            No rules configured
          </TableCell>
        </TableRow>
      ) : (
        rules.map((rule) => (
          <TableRow key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
            <TableCell>
              <Switch
                checked={rule.is_active}
                onCheckedChange={() => onToggle(rule)}
                disabled={!isAdmin}
              />
            </TableCell>
            <TableCell>
              <div className="font-medium">{rule.rule_name}</div>
              {rule.description && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {rule.description}
                </div>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell font-mono text-sm">
              {FIELD_OPTIONS.find(f => f.value === rule.field_path)?.label || rule.field_path}{" "}
              {rule.rule_value.operator} {String(rule.rule_value.value)}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {getSeverityBadge(rule.severity)}
            </TableCell>
            {isAdmin && (
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(rule)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(rule)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

export default ScreeningRules;
