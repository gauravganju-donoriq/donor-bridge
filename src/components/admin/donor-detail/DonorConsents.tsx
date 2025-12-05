import { useState, useEffect } from "react";
import { Copy, Link2, Eye, Loader2, ShieldCheck, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface DonorConsentsProps {
  donorId: string;
  donorName?: string;
}

interface Consent {
  id: string;
  consent_type: string;
  status: string;
  access_token: string;
  token_expires_at: string;
  signed_at: string | null;
  signed_document_path: string | null;
  created_at: string;
}

const CONSENT_TYPES = [
  { value: "hiv_testing", label: "HIV Testing Consent" },
  { value: "bone_marrow_donation", label: "Bone Marrow Donation Consent" },
  { value: "genetic_testing", label: "Genetic Testing Consent" },
  { value: "research_use", label: "Research Use Authorization" },
  { value: "hipaa_authorization", label: "HIPAA Authorization" },
];

const DonorConsents = ({ donorId, donorName = "Donor" }: DonorConsentsProps) => {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [consentToRevoke, setConsentToRevoke] = useState<Consent | null>(null);

  useEffect(() => {
    fetchConsents();
  }, [donorId]);

  const fetchConsents = async () => {
    try {
      const { data, error } = await supabase
        .from("donor_consents")
        .select("*")
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsents(data || []);
    } catch (error) {
      console.error("Error fetching consents:", error);
      toast.error("Failed to load consents");
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleRequestConsent = async (consentType: string) => {
    if (!user) return;

    setCreating(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase.from("donor_consents").insert({
        donor_id: donorId,
        consent_type: consentType,
        access_token: token,
        token_expires_at: expiresAt.toISOString(),
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Consent request created");
      fetchConsents();
    } catch (error: any) {
      console.error("Error creating consent request:", error);
      toast.error(error.message || "Failed to create consent request");
    } finally {
      setCreating(false);
    }
  };

  const getConsentLink = (consent: Consent) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/consent/${consent.access_token}`;
  };

  const handleCopyLink = (consent: Consent) => {
    navigator.clipboard.writeText(getConsentLink(consent));
    toast.success("Link copied to clipboard");
  };

  const handleViewDocument = async (consent: Consent) => {
    if (!consent.signed_document_path) return;

    try {
      const { data, error } = await supabase.storage
        .from("donor-documents")
        .download(consent.signed_document_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    }
  };

  const handleRevokeClick = (consent: Consent) => {
    setConsentToRevoke(consent);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!consentToRevoke) return;

    try {
      const { error } = await supabase
        .from("donor_consents")
        .update({ status: "revoked" })
        .eq("id", consentToRevoke.id);

      if (error) throw error;

      toast.success("Consent revoked");
      fetchConsents();
    } catch (error) {
      console.error("Error revoking consent:", error);
      toast.error("Failed to revoke consent");
    } finally {
      setRevokeDialogOpen(false);
      setConsentToRevoke(null);
    }
  };

  const getConsentTypeLabel = (type: string) => {
    return CONSENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getStatusBadge = (consent: Consent) => {
    const isExpired = new Date(consent.token_expires_at) < new Date();
    
    if (consent.status === "signed") {
      return (
        <Badge className="bg-green-500/10 text-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Signed
        </Badge>
      );
    }
    if (consent.status === "revoked") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Revoked
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Get latest consent by type
  const getLatestConsentByType = (type: string) => {
    return consents.find((c) => c.consent_type === type);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          Consent Forms
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-1" />
              )}
              Request Consent
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CONSENT_TYPES.map((type) => (
              <DropdownMenuItem
                key={type.value}
                onClick={() => handleRequestConsent(type.value)}
              >
                {type.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {consents.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm font-medium mb-1">No Consent Forms</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Request consent forms by clicking the button above. A shareable link will be generated.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consents.map((consent) => {
              const isExpired = new Date(consent.token_expires_at) < new Date();
              const isPending = consent.status === "pending" && !isExpired;
              
              return (
                <div
                  key={consent.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {getConsentTypeLabel(consent.consent_type)}
                      </p>
                      {getStatusBadge(consent)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {consent.status === "signed" && consent.signed_at
                        ? `Signed on ${format(new Date(consent.signed_at), "MMM d, yyyy 'at' h:mm a")}`
                        : isPending
                        ? `Expires ${format(new Date(consent.token_expires_at), "MMM d, yyyy")}`
                        : `Created ${format(new Date(consent.created_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {consent.status === "signed" && consent.signed_document_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(consent)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {isPending && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(consent)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevokeClick(consent)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </>
                    )}
                    {(consent.status === "revoked" || isExpired) && consent.status !== "signed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRequestConsent(consent.consent_type)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Consent Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this consent request? The link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeConfirm}>
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DonorConsents;
