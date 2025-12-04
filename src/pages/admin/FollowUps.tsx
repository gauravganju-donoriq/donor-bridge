import FollowUpsDashboard from "@/components/admin/FollowUpsDashboard";

const FollowUps = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Follow-Ups</h1>
        <p className="text-muted-foreground">Manage mandatory post-donation follow-up calls</p>
      </div>

      <FollowUpsDashboard />
    </div>
  );
};

export default FollowUps;
