import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const DonorApproval = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Donor Approval</h1>
        <p className="text-muted-foreground">Review and approve webform submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pending Submissions
          </CardTitle>
          <CardDescription>
            Review pre-screen form submissions and link to existing donors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Submission review will be implemented in Phase 2.7</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorApproval;
