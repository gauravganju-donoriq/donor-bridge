import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import { TIME_SLOTS, APPOINTMENT_LOCATIONS, AppointmentWithDonor } from "./types";

interface AppointmentCalendarProps {
  onScheduleClick?: (date: Date, time: string) => void;
}

const AppointmentCalendar = ({ onScheduleClick }: AppointmentCalendarProps) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchAppointments();
  }, [currentWeek]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          donors:donor_id (
            id,
            donor_id,
            first_name,
            last_name
          ),
          prescreener:prescreened_by (
            full_name
          )
        `)
        .gte("appointment_date", weekStart.toISOString())
        .lte("appointment_date", weekEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (locationFilter !== "all" && apt.location !== locationFilter) return false;
      if (typeFilter !== "all" && apt.appointment_type !== typeFilter) return false;
      return true;
    });
  }, [appointments, locationFilter, typeFilter]);

  const getAppointmentsForDayAndTime = (day: Date, timeSlot: string) => {
    return filteredAppointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date);
      const aptTime = format(aptDate, "HH:mm");
      return isSameDay(aptDate, day) && aptTime === timeSlot;
    });
  };

  const getAppointmentColor = (type: string | null) => {
    switch (type) {
      case "screening":
        return "bg-blue-500/10 border-blue-500/30 text-blue-700";
      case "donation":
        return "bg-green-500/10 border-green-500/30 text-green-700";
      default:
        return "bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date())}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {APPOINTMENT_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="donation">Donation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/30" />
            <span className="text-muted-foreground">Screening</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            <span className="text-muted-foreground">Donation</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="w-20 p-2 text-left text-sm font-medium text-muted-foreground sticky left-0 bg-background">
                  Time
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={`p-2 text-center text-sm font-medium min-w-[120px] ${
                      isSameDay(day, new Date()) ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-muted-foreground">{format(day, "EEE")}</div>
                    <div className={isSameDay(day, new Date()) ? "text-primary font-bold" : ""}>
                      {format(day, "d")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot) => (
                <tr key={timeSlot} className="border-b hover:bg-muted/30">
                  <td className="p-2 text-sm text-muted-foreground sticky left-0 bg-background border-r">
                    {format(new Date(`2000-01-01T${timeSlot}`), "h:mm a")}
                  </td>
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDayAndTime(day, timeSlot);
                    return (
                      <td
                        key={`${day.toISOString()}-${timeSlot}`}
                        className={`p-1 align-top min-h-[60px] ${
                          isSameDay(day, new Date()) ? "bg-primary/5" : ""
                        }`}
                        onClick={() => dayAppointments.length === 0 && onScheduleClick?.(day, timeSlot)}
                      >
                        {dayAppointments.length > 0 ? (
                          <div className="space-y-1">
                            {dayAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className={`p-2 rounded border text-xs cursor-pointer transition-colors hover:opacity-80 ${getAppointmentColor(apt.appointment_type)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/donors/${apt.donor_id}`);
                                }}
                              >
                                <div className="font-medium flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {apt.donors?.first_name} {apt.donors?.last_name}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                  <span className="capitalize">{apt.appointment_type}</span>
                                  {apt.donor_letter && (
                                    <Badge variant="outline" className="h-4 text-[10px] px-1">
                                      {apt.donor_letter}
                                    </Badge>
                                  )}
                                </div>
                                {apt.location && (
                                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="capitalize">{apt.location}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            className="h-full min-h-[40px] rounded border border-dashed border-transparent hover:border-muted-foreground/30 cursor-pointer"
                            title="Click to schedule"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
