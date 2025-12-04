import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const Donors = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donors</h1>
          <p className="text-muted-foreground">Manage donor records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Donor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Donor List
          </CardTitle>
          <CardDescription>
            View and manage all registered donors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Donor list will be implemented in Phase 2.4</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Donors;
