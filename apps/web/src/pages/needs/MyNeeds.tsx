import { NeedService } from "@/services/api";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui";
import type { NeedRequest } from "@/shared/validation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Eye, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export function MyNeeds() {
  const [activeTab, setActiveTab] = useState("published");
  const queryClient = useQueryClient();

  const { data: needs, isLoading } = useQuery({
    queryKey: ["myNeeds", activeTab],
    queryFn: () => NeedService.getMyNeeds(activeTab),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => NeedService.deleteNeed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNeeds"] });
      queryClient.invalidateQueries({ queryKey: ["needs"] });
    },
  });

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-800 border-green-200",
    draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    archived: "bg-gray-100 text-gray-800 border-gray-200",
    fulfilled: "bg-blue-100 text-blue-800 border-blue-200",
    expired: "bg-red-100 text-red-800 border-red-200",
  };

  const tabs = [
    { id: "published", label: "Active" },
    { id: "draft", label: "Drafts" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Needs</h1>
          <p className="text-muted-foreground mt-2">Manage your requested items.</p>
        </div>
        <Button asChild>
          <Link to="/needs/create">Post a Need</Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="border-b flex gap-6">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : needs?.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-card">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No needs found</h3>
          <p className="text-muted-foreground mb-6">
            You don't have any needs in the {activeTab} status.
          </p>
          {activeTab !== "published" && (
            <Button variant="outline" onClick={() => setActiveTab("published")}>
              View Active Needs
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {needs?.map((need: NeedRequest) => (
            <Card key={need.id} className="flex flex-col h-full overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant="outline" className={statusColors[need.status] || "bg-secondary"}>
                    {need.status.charAt(0).toUpperCase() + need.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {need.view_count} views
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-1">{need.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 py-2 flex-grow">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 border overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                    {need.images && need.images.length > 0 ? (
                      <img
                        loading="lazy"
                        src={need.images[0]}
                        alt={need.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      "No img"
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {need.description}
                    </p>
                    <div className="text-xs font-medium text-primary">
                      {need.offer_count} Offer(s) Received
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-3 border-t bg-muted/10 gap-2 grid grid-cols-3">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/needs/${need.id}`}>View</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/needs/${need.id}/edit`}>
                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this need request?")) {
                      deleteMutation.mutate(need.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  {deleteMutation.isPending ? "..." : "Delete"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
