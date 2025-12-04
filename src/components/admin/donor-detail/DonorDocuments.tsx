import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DonorDocumentsProps {
  donorId: string;
}

const DonorDocuments = ({ donorId }: DonorDocumentsProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Documents (0)</CardTitle>
        <Button size="sm" disabled>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 border-2 border-dashed rounded-lg mb-6">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium mb-1">Coming Soon</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Upload medical records, consent forms, and other documents.
          </p>
        </div>

        {/* Preview List */}
        <div className="space-y-2 opacity-50">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Preview
          </p>
          {[
            { name: "Consent Form.pdf", size: "245 KB", date: "Dec 1, 2024" },
            { name: "Medical History.pdf", size: "1.2 MB", date: "Nov 28, 2024" },
            { name: "ID Verification.jpg", size: "890 KB", date: "Nov 28, 2024" },
          ].map((doc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.size} • {doc.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DonorDocuments;