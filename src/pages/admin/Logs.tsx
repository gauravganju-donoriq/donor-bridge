import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

const Logs = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Activity Logs</h1>

      <Card>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Activity logs will be implemented in Phase 2.8</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
