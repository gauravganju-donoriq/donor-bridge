import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonorDocumentsProps {
  donorId: string;
}

const DonorDocuments = ({ donorId }: DonorDocumentsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">0 documents</p>
        <Button size="sm" variant="outline" disabled>
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </div>

      <div className="text-center py-8 border border-dashed rounded-lg">
        <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm font-medium mb-1">Coming Soon</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Upload medical records, consent forms, and other documents.
        </p>
      </div>

      {/* Preview List */}
      <div className="space-y-2 opacity-50">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Preview
        </p>
        {[
          { name: "Consent Form.pdf", size: "245 KB", date: "Dec 1, 2024" },
          { name: "Medical History.pdf", size: "1.2 MB", date: "Nov 28, 2024" },
          { name: "ID Verification.jpg", size: "890 KB", date: "Nov 28, 2024" },
        ].map((doc, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.size} • {doc.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonorDocuments;