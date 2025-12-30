import { useState, useEffect } from "react";
import { Bot, Save, RefreshCw, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceSettings {
  enabled: boolean;
  agent_name: string;
  greeting_template: string;
  closing_message: string;
  question_pain_level: string;
  question_current_pain: string;
  question_pain_medication: string;
  question_aspiration_sites: string;
  question_infection_signs: string;
  question_unusual_symptoms: string;
  question_doctor_rating: string;
  question_nurse_rating: string;
  question_staff_rating: string;
  question_donate_again: string;
  question_feedback: string;
  escalation_message: string;
  max_call_duration_seconds: string;
}

const defaultSettings: VoiceSettings = {
  enabled: true,
  agent_name: "Sarah",
  greeting_template: "",
  closing_message: "",
  question_pain_level: "",
  question_current_pain: "",
  question_pain_medication: "",
  question_aspiration_sites: "",
  question_infection_signs: "",
  question_unusual_symptoms: "",
  question_doctor_rating: "",
  question_nurse_rating: "",
  question_staff_rating: "",
  question_donate_again: "",
  question_feedback: "",
  escalation_message: "",
  max_call_duration_seconds: "300",
};

const VoiceAISettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("voice_ai_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const newSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.setting_key as keyof VoiceSettings;
        if (key in newSettings) {
          if (key === "enabled") {
            newSettings[key] = row.setting_value === "true";
          } else {
            (newSettings as Record<string, string | boolean>)[key] = row.setting_value;
          }
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load Voice AI settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("voice_ai_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Voice AI settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Voice AI Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings control how the AI voice agent conducts follow-up calls with donors.
          Use <code className="bg-muted px-1 rounded">{"{{donor_name}}"}</code> and{" "}
          <code className="bg-muted px-1 rounded">{"{{donation_date}}"}</code> as dynamic placeholders in your scripts.
        </AlertDescription>
      </Alert>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" />
            General Settings
          </CardTitle>
          <CardDescription>Enable or disable Voice AI and configure the agent identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Voice AI</Label>
              <p className="text-sm text-muted-foreground">Allow AI-powered follow-up calls</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>Agent Name</Label>
            <Input
              value={settings.agent_name}
              onChange={(e) => setSettings({ ...settings, agent_name: e.target.value })}
              placeholder="Sarah"
            />
            <p className="text-xs text-muted-foreground">The name the AI uses when introducing itself</p>
          </div>
        </CardContent>
      </Card>

      {/* Greeting & Closing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Greeting & Closing</CardTitle>
          <CardDescription>How the agent starts and ends the call.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Greeting Template</Label>
            <Textarea
              value={settings.greeting_template}
              onChange={(e) => setSettings({ ...settings, greeting_template: e.target.value })}
              rows={3}
              placeholder="Hi {{donor_name}}, this is {{agent_name}} calling from Donor Bridge..."
            />
          </div>
          <div className="space-y-2">
            <Label>Closing Message</Label>
            <Textarea
              value={settings.closing_message}
              onChange={(e) => setSettings({ ...settings, closing_message: e.target.value })}
              rows={2}
              placeholder="Thank you so much for your time..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Questionnaire Script */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Questionnaire Script</CardTitle>
          <CardDescription>The questions the AI asks during the follow-up call.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pain During Procedure (1-10)</Label>
              <Textarea
                value={settings.question_pain_level}
                onChange={(e) => setSettings({ ...settings, question_pain_level: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Pain Level (1-10)</Label>
              <Textarea
                value={settings.question_current_pain}
                onChange={(e) => setSettings({ ...settings, question_current_pain: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Pain Medication</Label>
              <Textarea
                value={settings.question_pain_medication}
                onChange={(e) => setSettings({ ...settings, question_pain_medication: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Aspiration Sites Check</Label>
              <Textarea
                value={settings.question_aspiration_sites}
                onChange={(e) => setSettings({ ...settings, question_aspiration_sites: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Signs of Infection</Label>
              <Textarea
                value={settings.question_infection_signs}
                onChange={(e) => setSettings({ ...settings, question_infection_signs: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Unusual Symptoms</Label>
              <Textarea
                value={settings.question_unusual_symptoms}
                onChange={(e) => setSettings({ ...settings, question_unusual_symptoms: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Doctor Rating (1-10)</Label>
              <Textarea
                value={settings.question_doctor_rating}
                onChange={(e) => setSettings({ ...settings, question_doctor_rating: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Nurse Rating (1-10)</Label>
              <Textarea
                value={settings.question_nurse_rating}
                onChange={(e) => setSettings({ ...settings, question_nurse_rating: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Staff Rating (1-10)</Label>
              <Textarea
                value={settings.question_staff_rating}
                onChange={(e) => setSettings({ ...settings, question_staff_rating: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Would Donate Again</Label>
              <Textarea
                value={settings.question_donate_again}
                onChange={(e) => setSettings({ ...settings, question_donate_again: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>General Feedback Question</Label>
            <Textarea
              value={settings.question_feedback}
              onChange={(e) => setSettings({ ...settings, question_feedback: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Escalation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escalation Settings</CardTitle>
          <CardDescription>How the agent responds when a donor reports concerning symptoms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Escalation Message</Label>
            <Textarea
              value={settings.escalation_message}
              onChange={(e) => setSettings({ ...settings, escalation_message: e.target.value })}
              rows={3}
              placeholder="I'm sorry to hear that. I'm going to make a note of this..."
            />
            <p className="text-xs text-muted-foreground">
              This message is used when the donor reports signs of infection or unusual symptoms.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technical Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Max Call Duration (seconds)</Label>
            <Input
              type="number"
              value={settings.max_call_duration_seconds}
              onChange={(e) => setSettings({ ...settings, max_call_duration_seconds: e.target.value })}
              min={60}
              max={600}
            />
            <p className="text-xs text-muted-foreground">Maximum duration for AI calls (60-600 seconds)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceAISettings;
