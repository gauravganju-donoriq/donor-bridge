import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, List, Plus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import AppointmentCalendar from "@/components/admin/appointments/AppointmentCalendar";
import AppointmentList from "@/components/admin/appointments/AppointmentList";
import AppointmentScheduleDialog from "@/components/admin/appointments/AppointmentScheduleDialog";

interface Donor {
  id: string;
  donor_id: string;
  first_name: string;
  last_name: string;
}

const Appointments = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    const { data } = await supabase
      .from("donors")
      .select("id, donor_id, first_name, last_name")
      .eq("eligibility_status", "eligible")
      .order("last_name");
    if (data) setDonors(data);
  };

  const handleNewAppointment = () => {
    setDonorSearchOpen(true);
  };

  const handleDonorSelect = (donor: Donor) => {
    setSelectedDonor(donor);
    setDonorSearchOpen(false);
    setScheduleDialogOpen(true);
  };

  const handleCalendarSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date);
    setPreselectedTime(time);
    setDonorSearchOpen(true);
  };

  const handleScheduleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setSelectedDonor(null);
    setPreselectedDate(null);
    setPreselectedTime(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Appointments</h1>
        <Button onClick={handleNewAppointment}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <AppointmentCalendar
            key={`calendar-${refreshKey}`}
            onScheduleClick={handleCalendarSlotClick}
          />
        </TabsContent>

        <TabsContent value="list">
          <AppointmentList key={`list-${refreshKey}`} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
        </TabsContent>
      </Tabs>

      {/* Donor Search Dialog */}
      <Dialog open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Donor</DialogTitle>
            <DialogDescription>
              Search and select a donor to schedule an appointment.
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search donors..." />
            <CommandList>
              <CommandEmpty>No donors found.</CommandEmpty>
              <CommandGroup heading="Eligible Donors">
                {donors.map((donor) => (
                  <CommandItem
                    key={donor.id}
                    value={`${donor.first_name} ${donor.last_name} ${donor.donor_id}`}
                    onSelect={() => handleDonorSelect(donor)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {donor.first_name} {donor.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{donor.donor_id}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Dialog */}
      {selectedDonor && (
        <AppointmentScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={(open) => {
            setScheduleDialogOpen(open);
            if (!open) {
              setSelectedDonor(null);
              setPreselectedDate(null);
              setPreselectedTime(null);
            }
          }}
          donorId={selectedDonor.id}
          donorName={`${selectedDonor.first_name} ${selectedDonor.last_name}`}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
};

export default Appointments;
