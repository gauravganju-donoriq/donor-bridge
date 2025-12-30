import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EvaluationBadgeProps {
  recommendation: string | null;
}

export const EvaluationBadge = ({ recommendation }: EvaluationBadgeProps) => {
  const getBadgeContent = () => {
    switch (recommendation) {
      case "suitable":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Suitable",
          className: "bg-green-500/10 text-green-600 border-green-200",
          tooltip: "No disqualifying factors found",
        };
      case "unsuitable":
        return {
          icon: <XCircle className="h-3 w-3" />,
          label: "Unsuitable",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          tooltip: "One or more hard disqualifiers triggered",
        };
      case "review_required":
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          label: "Review",
          className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
          tooltip: "Soft flags require manual review",
        };
      case "pending":
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Pending",
          className: "bg-muted text-muted-foreground",
          tooltip: "Evaluation pending",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          label: "Not Evaluated",
          className: "bg-muted text-muted-foreground border-muted",
          tooltip: "Click to evaluate",
        };
    }
  };

  const content = getBadgeContent();

  const badge = (
    <Badge variant="outline" className={`gap-1 ${content.className}`}>
      {content.icon}
      {content.label}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{content.tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default EvaluationBadge;
