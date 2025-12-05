import { useState, useEffect } from "react";
import { Copy, Link2, Eye, Loader2, ShieldCheck, Clock, CheckCircle, XCircle, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface ConsentGroup {
  token: string;
  expiresAt: string;
  createdAt: string;
  consents: Consent[];
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
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleRequestConsent = async () => {
    if (!user || selectedTypes.length === 0) return;

    setCreating(true);
    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create a consent record for each selected type with the same token
      const records = selectedTypes.map(consentType => ({
        donor_id: donorId,
        consent_type: consentType,
        access_token: token,
        token_expires_at: expiresAt.toISOString(),
        created_by: user.id,
      }));

      const { error } = await supabase.from("donor_consents").insert(records);

      if (error) throw error;

      toast.success(`Consent request created for ${selectedTypes.length} form(s)`);
      setRequestDialogOpen(false);
      setSelectedTypes([]);
      fetchConsents();
    } catch (error: any) {
      console.error("Error creating consent request:", error);
      toast.error(error.message || "Failed to create consent request");
    } finally {
      setCreating(false);
    }
  };

  const getConsentLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/consent/${token}`;
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(getConsentLink(token));
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

  const handleRevokeClick = (token: string) => {
    setTokenToRevoke(token);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!tokenToRevoke) return;

    try {
      const { error } = await supabase
        .from("donor_consents")
        .update({ status: "revoked" })
        .eq("access_token", tokenToRevoke);

      if (error) throw error;

      toast.success("Consent request revoked");
      fetchConsents();
    } catch (error) {
      console.error("Error revoking consent:", error);
      toast.error("Failed to revoke consent");
    } finally {
      setRevokeDialogOpen(false);
      setTokenToRevoke(null);
    }
  };

  const handleDeleteClick = (token: string) => {
    setTokenToDelete(token);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tokenToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("donor_consents")
        .delete()
        .eq("access_token", tokenToDelete);

      if (error) throw error;

      toast.success("Consent request deleted");
      fetchConsents();
    } catch (error) {
      console.error("Error deleting consent:", error);
      toast.error("Failed to delete consent request");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTokenToDelete(null);
    }
  };

  const getConsentTypeLabel = (type: string) => {
    return CONSENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const toggleConsentType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Group consents by access_token
  const groupedConsents = consents.reduce<ConsentGroup[]>((groups, consent) => {
    const existing = groups.find(g => g.token === consent.access_token);
    if (existing) {
      existing.consents.push(consent);
    } else {
      groups.push({
        token: consent.access_token,
        expiresAt: consent.token_expires_at,
        createdAt: consent.created_at,
        consents: [consent],
      });
    }
    return groups;
  }, []);

  const getGroupStatus = (group: ConsentGroup) => {
    const allSigned = group.consents.every(c => c.status === "signed");
    const anyRevoked = group.consents.some(c => c.status === "revoked");
    const isExpired = new Date(group.expiresAt) < new Date();
    const signedCount = group.consents.filter(c => c.status === "signed").length;
    
    if (allSigned) return { status: "signed", label: "All Signed" };
    if (anyRevoked) return { status: "revoked", label: "Revoked" };
    if (isExpired) return { status: "expired", label: "Expired" };
    if (signedCount > 0) return { status: "partial", label: `${signedCount}/${group.consents.length} Signed` };
    return { status: "pending", label: "Pending" };
  };

  const getStatusBadge = (group: ConsentGroup) => {
    const { status, label } = getGroupStatus(group);
    
    switch (status) {
      case "signed":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-blue-500/10 text-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        );
    }
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
        <Button size="sm" onClick={() => setRequestDialogOpen(true)}>
          <Link2 className="h-4 w-4 mr-1" />
          Request Consent
        </Button>
      </CardHeader>
      <CardContent>
        {groupedConsents.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No consent forms</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedConsents.map((group) => {
              const { status } = getGroupStatus(group);
              const isPending = status === "pending" || status === "partial";
              const canResend = status === "revoked" || status === "expired";
              
              return (
                <div
                  key={group.token}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(group)}
                      <span className="text-xs text-muted-foreground">
                        {status === "signed" 
                          ? `Signed ${format(new Date(group.consents[0].signed_at!), "MMM d, yyyy")}`
                          : isPending
                          ? `Expires ${format(new Date(group.expiresAt), "MMM d, yyyy")}`
                          : `Created ${format(new Date(group.createdAt), "MMM d, yyyy")}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPending && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(group.token)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRevokeClick(group.token)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(group.token)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {canResend && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTypes(group.consents.map(c => c.consent_type));
                              setRequestDialogOpen(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(group.token)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* List of consent types in this group */}
                  <div className="space-y-2">
                    {group.consents.map((consent) => (
                      <div 
                        key={consent.id}
                        className="flex items-center justify-between py-2 px-3 bg-background rounded border"
                      >
                        <div className="flex items-center gap-2">
                          {consent.status === "signed" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {getConsentTypeLabel(consent.consent_type)}
                          </span>
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Request Consent Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Consent Forms</DialogTitle>
            <DialogDescription>
              Select the consent forms required for {donorName}. A single link will be generated for all selected forms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {CONSENT_TYPES.map((type) => (
              <div
                key={type.value}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleConsentType(type.value)}
              >
                <Checkbox
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => toggleConsentType(type.value)}
                />
                <span className="text-sm font-medium">{type.label}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestConsent} 
              disabled={selectedTypes.length === 0 || creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-1" />
              )}
              Generate Link ({selectedTypes.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Consent Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this consent request? The link will no longer work for any of the forms.
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Consent Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this consent request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DonorConsents;
