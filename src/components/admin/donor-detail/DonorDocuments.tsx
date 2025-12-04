import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DonorDocumentsProps {
  donorId: string;
}

const DonorDocuments = ({ donorId }: DonorDocumentsProps) => {
  // Placeholder - documents feature would require storage bucket setup
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Medical records, consent forms, and other documents</CardDescription>
        </div>
        <Button size="sm" disabled>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Document Storage Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The document upload feature is being developed. You'll be able to store
            medical records, consent forms, ID documents, and other files here.
          </p>
        </div>

        {/* Preview of what the document list will look like */}
        <div className="mt-6 space-y-2 opacity-50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Preview of Document List
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
                  <p className="text-xs text-muted-foreground">
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
