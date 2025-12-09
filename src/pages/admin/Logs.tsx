import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Filter,
  User,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ScrollText,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";

interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Json | null;
  user_id: string | null;
  created_at: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface ActivityLogWithUser extends ActivityLog {
  userName: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ENTITY_TYPES = [
  { value: "all", label: "All Entities" },
  { value: "donor", label: "Donor" },
  { value: "appointment", label: "Appointment" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "payment", label: "Payment" },
  { value: "consent", label: "Consent" },
  { value: "questionnaire", label: "Questionnaire" },
  { value: "submission", label: "Submission" },
];

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "eligibility_changed", label: "Eligibility Changed" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
];

const Logs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply entity type filter
      if (entityTypeFilter !== "all") {
        query = query.eq("entity_type", entityTypeFilter);
      }

      // Apply action filter
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      // Apply date range filter
      if (dateRangeFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (dateRangeFilter) {
          case "today":
            startDate = startOfDay(now);
            break;
          case "7days":
            startDate = subDays(now, 7);
            break;
          case "30days":
            startDate = subDays(now, 30);
            break;
          case "90days":
            startDate = subDays(now, 90);
            break;
          default:
            startDate = subDays(now, 30);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      // Apply search filter (action or entity_type)
      if (searchQuery.trim()) {
        query = query.or(
          `action.ilike.%${searchQuery}%,entity_type.ilike.%${searchQuery}%`
        );
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Fetch user profiles for logs that have user_id
      const userIds = [...new Set((data || []).filter(l => l.user_id).map(l => l.user_id))];
      let profilesMap: Record<string, Profile> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, Profile>);
        }
      }

      // Merge logs with user names
      const logsWithUsers: ActivityLogWithUser[] = (data || []).map(log => ({
        ...log,
        userName: log.user_id && profilesMap[log.user_id]
          ? profilesMap[log.user_id].full_name || profilesMap[log.user_id].email
          : "System"
      }));

      setLogs(logsWithUsers);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize, entityTypeFilter, actionFilter, dateRangeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const hasActiveFilters =
    searchQuery ||
    entityTypeFilter !== "all" ||
    actionFilter !== "all" ||
    dateRangeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setEntityTypeFilter("all");
    setActionFilter("all");
    setDateRangeFilter("all");
    setCurrentPage(1);
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "donor":
        return <User className="h-4 w-4" />;
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      case "follow_up":
        return <Phone className="h-4 w-4" />;
      case "payment":
        return <DollarSign className="h-4 w-4" />;
      case "consent":
      case "questionnaire":
        return <FileText className="h-4 w-4" />;
      case "submission":
        return <ScrollText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" =
      "secondary";
    let className = "";

    switch (action) {
      case "created":
        className = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        break;
      case "updated":
        className = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        break;
      case "deleted":
        variant = "destructive";
        break;
      case "eligibility_changed":
        className = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
        break;
      case "approved":
        className = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        break;
      case "rejected":
        variant = "destructive";
        break;
      case "completed":
        className = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
        break;
      default:
        variant = "outline";
    }

    return (
      <Badge variant={variant} className={className}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  const handleEntityClick = (entityType: string, entityId: string | null) => {
    if (!entityId) return;

    switch (entityType) {
      case "donor":
        navigate(`/admin/donors/${entityId}`);
        break;
      case "appointment":
        navigate(`/admin/appointments`);
        break;
      case "follow_up":
        navigate(`/admin/follow-ups`);
        break;
      default:
        break;
    }
  };

  const formatDetails = (details: Json | null): string => {
    if (!details) return "No details";
    if (typeof details === "string") return details;
    return JSON.stringify(details, null, 2);
  };

  const getDetailsSummary = (details: Json | null): string => {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
      return "View details";
    }

    const obj = details as Record<string, unknown>;

    // For eligibility changes, show a nice summary
    if (obj.from_status && obj.to_status) {
      return `${obj.from_status} → ${obj.to_status}`;
    }

    // For other changes, show first few keys
    const keys = Object.keys(obj).slice(0, 2);
    if (keys.length === 0) return "View details";
    return keys.join(", ") + (Object.keys(obj).length > 2 ? "..." : "");
  };

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
        </span>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Activity Logs</h1>
        <Badge variant="secondary">{totalCount}</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by action or entity type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[160px]">Action</TableHead>
                <TableHead className="w-[180px]">Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ScrollText className="h-12 w-12 mb-4" />
                      <p>No activity logs found</p>
                      {hasActiveFilters && (
                        <Button
                          variant="link"
                          onClick={clearFilters}
                          className="mt-2"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <Collapsible key={log.id} asChild>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleRowExpanded(log.id)}
                            >
                              {expandedRows.has(log.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.created_at
                            ? format(new Date(log.created_at), "MMM d, yyyy h:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entity_type)}
                            <span className="capitalize">{log.entity_type}</span>
                            {log.entity_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEntityClick(log.entity_type, log.entity_id);
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getDetailsSummary(log.details)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.userName}
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6}>
                            <div className="p-4">
                              <h4 className="text-sm font-medium mb-2">
                                Full Details
                              </h4>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48">
                                {formatDetails(log.details)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && logs.length > 0 && (
            <div className="p-4 border-t">
              <PaginationControls />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
