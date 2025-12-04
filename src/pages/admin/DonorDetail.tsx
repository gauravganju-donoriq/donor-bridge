import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Heart, Calendar, FileText, Loader2, MessageSquare, Clock, DollarSign, FlaskConical, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { differenceInYears, format } from "date-fns";

// Tab components
import DonorPersonalInfo from "@/components/admin/donor-detail/DonorPersonalInfo";
import DonorMedicalHistory from "@/components/admin/donor-detail/DonorMedicalHistory";
import DonorAppointments from "@/components/admin/donor-detail/DonorAppointments";
import DonorDocuments from "@/components/admin/donor-detail/DonorDocuments";
import DonorNotes from "@/components/admin/donor-detail/DonorNotes";
import DonorTimeline from "@/components/admin/donor-detail/DonorTimeline";
import DonorPayments from "@/components/admin/donor-detail/DonorPayments";
import DonorResults from "@/components/admin/donor-detail/DonorResults";
import DonorFollowUps from "@/components/admin/donor-detail/DonorFollowUps";

type Donor = Tables<"donors">;

const DonorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Donor>>({});

  useEffect(() => {
    const fetchDonor = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("donors")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Not Found",
            description: "Donor not found.",
            variant: "destructive",
          });
          navigate("/admin/donors");
          return;
        }

        setDonor(data);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching donor:", error);
        toast({
          title: "Error",
          description: "Failed to load donor details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!donor || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("donors")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      setDonor({ ...donor, ...formData } as Donor);
      setEditMode(false);
      toast({
        title: "Saved",
        description: "Donor information updated successfully.",
      });
    } catch (error) {
      console.error("Error saving donor:", error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(donor || {});
    setEditMode(false);
  };

  const getEligibilityBadge = (status: string | null) => {
    switch (status) {
      case "eligible":
        return <Badge className="bg-green-500/10 text-green-600">Eligible</Badge>;
      case "ineligible":
        return <Badge variant="destructive">Ineligible</Badge>;
      case "pending_review":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!donor) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/donors")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {donor.first_name} {donor.last_name}
              </h1>
              {getEligibilityBadge(donor.eligibility_status)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="font-mono text-sm">{donor.donor_id}</span>
              <span>•</span>
              <span>{differenceInYears(new Date(), new Date(donor.birth_date))} years old</span>
              <span>•</span>
              <span className="capitalize">{donor.assigned_sex}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Edit Donor</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="personal" className="gap-1.5 text-sm h-7 px-3">
            <User className="h-3.5 w-3.5" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="medical" className="gap-1.5 text-sm h-7 px-3">
            <Heart className="h-3.5 w-3.5" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 text-sm h-7 px-3">
            <Calendar className="h-3.5 w-3.5" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5 text-sm h-7 px-3">
            <FlaskConical className="h-3.5 w-3.5" />
            Results
          </TabsTrigger>
          <TabsTrigger value="followups" className="gap-1.5 text-sm h-7 px-3">
            <Phone className="h-3.5 w-3.5" />
            Follow-Ups
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-sm h-7 px-3">
            <DollarSign className="h-3.5 w-3.5" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 text-sm h-7 px-3">
            <FileText className="h-3.5 w-3.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 text-sm h-7 px-3">
            <MessageSquare className="h-3.5 w-3.5" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-sm h-7 px-3">
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <DonorPersonalInfo
            donor={donor}
            formData={formData}
            setFormData={setFormData}
            editMode={editMode}
          />
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <DonorMedicalHistory
            donor={donor}
            formData={formData}
            setFormData={setFormData}
            editMode={editMode}
          />
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <DonorAppointments donorId={donor.id} donorName={`${donor.first_name} ${donor.last_name}`} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <DonorResults donorId={donor.id} />
        </TabsContent>

        <TabsContent value="followups" className="mt-4">
          <DonorFollowUps donorId={donor.id} donorName={`${donor.first_name} ${donor.last_name}`} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <DonorPayments donorId={donor.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DonorDocuments donorId={donor.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <DonorNotes donorId={donor.id} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <DonorTimeline donorId={donor.id} donorCreatedAt={donor.created_at || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DonorDetail;
