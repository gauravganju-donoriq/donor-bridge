import { useState, useEffect } from "react";
import { Calendar, MessageSquare, UserPlus, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "note" | "appointment" | "created" | "status_change";
  title: string;
  description?: string;
  timestamp: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

interface DonorTimelineProps {
  donorId: string;
  donorCreatedAt?: string;
}

const DonorTimeline = ({ donorId, donorCreatedAt }: DonorTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [donorId]);

  const fetchTimeline = async () => {
    try {
      // Fetch notes
      const { data: notes } = await supabase
        .from("donor_notes")
        .select("id, content, created_at, created_by")
        .eq("donor_id", donorId);

      // Fetch appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_type, status, created_at")
        .eq("donor_id", donorId);

      // Fetch activity logs for this donor
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("id, action, details, created_at, user_id")
        .eq("entity_type", "donor")
        .eq("entity_id", donorId);

      // Get profiles for authors
      const authorIds = new Set<string>();
      notes?.forEach((n) => authorIds.add(n.created_by));
      logs?.forEach((l) => l.user_id && authorIds.add(l.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(authorIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name || p.email]) || []);

      // Build timeline events
      const timelineEvents: TimelineEvent[] = [];

      // Add donor creation event
      if (donorCreatedAt) {
        timelineEvents.push({
          id: "created",
          type: "created",
          title: "Donor profile created",
          timestamp: donorCreatedAt,
        });
      }

      // Add notes
      notes?.forEach((note) => {
        timelineEvents.push({
          id: `note-${note.id}`,
          type: "note",
          title: "Note added",
          description: note.content,
          timestamp: note.created_at,
          author: profileMap.get(note.created_by),
        });
      });

      // Add appointments
      appointments?.forEach((apt) => {
        const statusLabels: Record<string, string> = {
          scheduled: "Appointment scheduled",
          completed: "Appointment completed",
          cancelled: "Appointment cancelled",
          no_show: "No show recorded",
        };

        timelineEvents.push({
          id: `apt-${apt.id}`,
          type: "appointment",
          title: statusLabels[apt.status || "scheduled"] || "Appointment",
          description: apt.appointment_type
            ? `${apt.appointment_type.replace("_", " ")} - ${format(new Date(apt.appointment_date), "MMM d, yyyy 'at' h:mm a")}`
            : format(new Date(apt.appointment_date), "MMM d, yyyy 'at' h:mm a"),
          timestamp: apt.created_at || apt.appointment_date,
          metadata: { status: apt.status },
        });
      });

      // Add activity logs
      logs?.forEach((log) => {
        timelineEvents.push({
          id: `log-${log.id}`,
          type: "status_change",
          title: log.action,
          description: typeof log.details === "object" ? JSON.stringify(log.details) : undefined,
          timestamp: log.created_at || "",
          author: log.user_id ? profileMap.get(log.user_id) : undefined,
        });
      });

      // Sort by timestamp descending
      timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: TimelineEvent["type"], metadata?: Record<string, unknown>) => {
    switch (type) {
      case "note":
        return <MessageSquare className="h-4 w-4" />;
      case "appointment":
        const status = metadata?.status as string;
        if (status === "completed") return <CheckCircle className="h-4 w-4" />;
        if (status === "cancelled" || status === "no_show") return <XCircle className="h-4 w-4" />;
        return <Calendar className="h-4 w-4" />;
      case "created":
        return <UserPlus className="h-4 w-4" />;
      case "status_change":
        return <Edit className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent["type"], metadata?: Record<string, unknown>) => {
    switch (type) {
      case "note":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "appointment":
        const status = metadata?.status as string;
        if (status === "completed") return "bg-green-500/10 text-green-600 border-green-200";
        if (status === "cancelled" || status === "no_show") return "bg-red-500/10 text-red-600 border-red-200";
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "created":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "status_change":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Activity Timeline ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${getEventColor(
                      event.type,
                      event.metadata
                    )}`}
                  >
                    {getEventIcon(event.type, event.metadata)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge variant="outline" className="text-xs font-normal">
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {event.author && (
                        <span className="text-xs text-muted-foreground">by {event.author}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DonorTimeline;