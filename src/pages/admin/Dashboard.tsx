import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, addWeeks } from "date-fns";

interface DashboardMetrics {
  totalDonors: number;
  pendingApprovals: number;
  upcomingAppointments: number;
  eligibleDonors: number;
  ineligibleDonors: number;
  pendingReviewDonors: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: unknown;
}

interface ChartData {
  name: string;
  submissions: number;
  appointments: number;
}

interface UpcomingEligibleDonor {
  id: string;
  first_name: string;
  last_name: string;
  donor_id: string;
  next_eligible_date: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--destructive))"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDonors: 0,
    pendingApprovals: 0,
    upcomingAppointments: 0,
    eligibleDonors: 0,
    ineligibleDonors: 0,
    pendingReviewDonors: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [upcomingEligible, setUpcomingEligible] = useState<UpcomingEligibleDonor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch total donors count
        const { count: totalDonors } = await supabase
          .from("donors")
          .select("*", { count: "exact", head: true });

        // Fetch donors by eligibility status
        const { data: donorsByStatus } = await supabase
          .from("donors")
          .select("eligibility_status");

        const eligibleDonors = donorsByStatus?.filter(
          (d) => d.eligibility_status === "eligible"
        ).length || 0;
        const ineligibleDonors = donorsByStatus?.filter(
          (d) => d.eligibility_status === "ineligible"
        ).length || 0;
        const pendingReviewDonors = donorsByStatus?.filter(
          (d) => d.eligibility_status === "pending_review"
        ).length || 0;

        // Fetch pending approvals (webform submissions)
        const { count: pendingApprovals } = await supabase
          .from("webform_submissions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch upcoming appointments
        const { count: upcomingAppointments } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("status", "scheduled")
          .gte("appointment_date", new Date().toISOString());

        // Fetch recent activity logs
        const { data: activityLogs } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch weekly data for chart
        const weeklyChartData: ChartData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dayStart = startOfDay(date).toISOString();
          const dayEnd = endOfDay(date).toISOString();

          const { count: submissionsCount } = await supabase
            .from("webform_submissions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dayStart)
            .lte("created_at", dayEnd);

          const { count: appointmentsCount } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .gte("appointment_date", dayStart)
            .lte("appointment_date", dayEnd);

          weeklyChartData.push({
            name: format(date, "EEE"),
            submissions: submissionsCount || 0,
            appointments: appointmentsCount || 0,
          });
        }

        // Fetch donors becoming eligible within next 2 weeks
        const today = new Date().toISOString().split('T')[0];
        const twoWeeksFromNow = addWeeks(new Date(), 2).toISOString().split('T')[0];
        
        const { data: upcomingEligibleDonors } = await supabase
          .from("donors")
          .select("id, first_name, last_name, donor_id, next_eligible_date")
          .eq("eligibility_status", "temporarily_deferred" as any)
          .gte("next_eligible_date", today)
          .lte("next_eligible_date", twoWeeksFromNow)
          .order("next_eligible_date", { ascending: true })
          .limit(10);

        setMetrics({
          totalDonors: totalDonors || 0,
          pendingApprovals: pendingApprovals || 0,
          upcomingAppointments: upcomingAppointments || 0,
          eligibleDonors,
          ineligibleDonors,
          pendingReviewDonors,
        });
        setRecentActivity(activityLogs || []);
        setWeeklyData(weeklyChartData);
        setUpcomingEligible(upcomingEligibleDonors || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pieData = [
    { name: "Eligible", value: metrics.eligibleDonors },
    { name: "Pending Review", value: metrics.pendingReviewDonors },
    { name: "Ineligible", value: metrics.ineligibleDonors },
  ].filter((d) => d.value > 0);

  const getActionIcon = (action: string) => {
    if (action.includes("create") || action.includes("add")) return <UserPlus className="h-4 w-4 text-green-500" />;
    if (action.includes("update") || action.includes("edit")) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    if (action.includes("approve")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("reject")) return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/donors")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{metrics.totalDonors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.eligibleDonors} eligible
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/donor-approval")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{metrics.pendingApprovals}</div>
            {metrics.pendingApprovals > 0 && (
              <Badge variant="destructive" className="mt-1 text-xs">
                Needs attention
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/appointments")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{metrics.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{metrics.pendingReviewDonors}</div>
            <p className="text-xs text-muted-foreground mt-1">Donors awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="submissions"
                    name="Submissions"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="appointments"
                    name="Appointments"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donor Status Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Donor Eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No donor data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity, Quick Actions & Upcoming Eligible */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    {getActionIcon(log.action)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.entity_type} •{" "}
                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate("/admin/logs")}
            >
              View All Logs
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Eligible Donors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-green-500" />
              Becoming Eligible Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEligible.length > 0 ? (
              <div className="space-y-3">
                {upcomingEligible.map((donor) => (
                  <div
                    key={donor.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/donors/${donor.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {donor.first_name} {donor.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {donor.donor_id}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      {format(new Date(donor.next_eligible_date), "MMM d")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No donors becoming eligible soon</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/admin/donor-approval")}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Review Pending Applications
              {metrics.pendingApprovals > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {metrics.pendingApprovals}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/admin/appointments")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Appointments
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/admin/donors")}
            >
              <Users className="h-4 w-4 mr-2" />
              View All Donors
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/admin/reports")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
