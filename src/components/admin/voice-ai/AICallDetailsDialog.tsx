import { Bot, Play, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParsedResponses {
  call_successful?: boolean;
  pain_level?: number | null;
  current_pain_level?: number | null;
  doctor_rating?: number | null;
  nurse_rating?: number | null;
  staff_rating?: number | null;
  took_pain_medication?: boolean | null;
  pain_medication_details?: string | null;
  checked_aspiration_sites?: boolean | null;
  aspiration_sites_notes?: string | null;
  signs_of_infection?: boolean | null;
  infection_details?: string | null;
  unusual_symptoms?: boolean | null;
  symptoms_details?: string | null;
  would_donate_again?: boolean | null;
  procedure_feedback?: string | null;
  concerns_flagged?: boolean;
  summary?: string;
}

interface AICallDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: string | null;
  recordingUrl: string | null;
  parsedResponses: ParsedResponses | null;
  callDurationMs: number | null;
  callStatus: string | null;
  calledAt: string | null;
  onApplyData?: () => void;
}

const AICallDetailsDialog = ({
  open,
  onOpenChange,
  transcript,
  recordingUrl,
  parsedResponses,
  callDurationMs,
  callStatus,
  calledAt,
  onApplyData,
}: AICallDetailsDialogProps) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Call Details
          </DialogTitle>
          <DialogDescription>
            View the transcript and extracted data from the AI follow-up call.
          </DialogDescription>
        </DialogHeader>

        {/* Call Info */}
        <div className="flex items-center gap-4 text-sm">
          {callStatus && (
            <Badge
              variant={callStatus === "completed" ? "default" : "secondary"}
              className={callStatus === "completed" ? "bg-green-500/10 text-green-600" : ""}
            >
              {callStatus === "completed" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : null}
              {callStatus}
            </Badge>
          )}
          {callDurationMs && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(callDurationMs)}
            </div>
          )}
          {calledAt && (
            <span className="text-muted-foreground">{formatDateTime(calledAt)}</span>
          )}
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Left: Transcript */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[400px] p-4">
                {transcript ? (
                  <pre className="text-sm whitespace-pre-wrap font-sans">{transcript}</pre>
                ) : (
                  <p className="text-muted-foreground text-sm">No transcript available</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Parsed Data */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Extracted Data
                {parsedResponses?.concerns_flagged && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Concerns Flagged
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[400px] p-4">
                {parsedResponses ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    {parsedResponses.summary && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{parsedResponses.summary}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Pain Assessment */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Pain Assessment
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">During Procedure:</span>{" "}
                          {renderValue(parsedResponses.pain_level)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current:</span>{" "}
                          {renderValue(parsedResponses.current_pain_level)}
                        </div>
                      </div>
                    </div>

                    {/* Staff Ratings */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Staff Ratings
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Doctor:</span>{" "}
                          {renderValue(parsedResponses.doctor_rating)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Nurse:</span>{" "}
                          {renderValue(parsedResponses.nurse_rating)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Staff:</span>{" "}
                          {renderValue(parsedResponses.staff_rating)}
                        </div>
                      </div>
                    </div>

                    {/* Recovery */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Recovery
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Pain Medication:</span>{" "}
                          {renderValue(parsedResponses.took_pain_medication)}
                          {parsedResponses.pain_medication_details && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({parsedResponses.pain_medication_details})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Checked Sites:</span>{" "}
                          {renderValue(parsedResponses.checked_aspiration_sites)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Infection Signs:</span>{" "}
                          {renderValue(parsedResponses.signs_of_infection)}
                          {parsedResponses.infection_details && (
                            <span className="text-destructive">
                              {" "}
                              ({parsedResponses.infection_details})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Unusual Symptoms:</span>{" "}
                          {renderValue(parsedResponses.unusual_symptoms)}
                          {parsedResponses.symptoms_details && (
                            <span className="text-destructive">
                              {" "}
                              ({parsedResponses.symptoms_details})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Future Donation */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Future Donation
                      </h4>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Would Donate Again:</span>{" "}
                        {renderValue(parsedResponses.would_donate_again)}
                      </div>
                    </div>

                    {/* Feedback */}
                    {parsedResponses.procedure_feedback && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                          Feedback
                        </h4>
                        <p className="text-sm">{parsedResponses.procedure_feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No data extracted</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Recording Player */}
        {recordingUrl && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Play className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Recording:</span>
            <audio controls src={recordingUrl} className="h-8 flex-1" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onApplyData && parsedResponses && (
            <Button onClick={onApplyData}>
              <Bot className="h-4 w-4 mr-2" />
              Apply to Follow-Up
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AICallDetailsDialog;
