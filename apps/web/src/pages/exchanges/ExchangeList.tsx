import { ExchangeService } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui";
import { Badge } from "@/shared/components/ui";
import type { Exchange } from "@/shared/validation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

export const ExchangeList = () => {
  const [activeTab, setActiveTab] = useState("incoming");

  const { data: incoming = [], isLoading: loadingIncoming } = useQuery({
    queryKey: ["exchanges", "incoming"],
    queryFn: ExchangeService.getIncomingExchanges,
  });

  const { data: outgoing = [], isLoading: loadingOutgoing } = useQuery({
    queryKey: ["exchanges", "outgoing"],
    queryFn: ExchangeService.getOutgoingExchanges,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["exchanges", "history"],
    queryFn: ExchangeService.getExchangeHistory,
  });

  const getStatusBadgeVariant = (status: Exchange["status"]) => {
    switch (status) {
      case "accepted":
      case "ready_for_shipping":
        return "default";
      case "pending":
      case "counter_offered":
        return "secondary";
      case "rejected":
      case "cancelled":
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderExchangeCard = (exchange: Exchange) => (
    <Card key={exchange.id} className="hover:bg-muted/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold truncate flex gap-2 items-center">
            Exchange Request
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(exchange.status)} className="capitalize">
            {exchange.status.replace("_", " ")}
          </Badge>
        </div>
        <CardDescription>
          Requested {new Date(exchange.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
          <div>
            <strong>Offering:</strong> {exchange.offered_product_ids.length} item(s)
          </div>
          <div>
            <strong>Requesting:</strong> {exchange.requested_product_ids.length} item(s)
          </div>
        </div>
        <Link
          to={`/exchanges/${exchange.id}`}
          className="text-primary hover:underline text-sm font-medium"
        >
          View Details &rarr;
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchanges</h1>
          <p className="text-muted-foreground">Manage your exchange requests and offers.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming
            {incoming.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10">
                {incoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          {loadingIncoming ? (
            <div>Loading incoming requests...</div>
          ) : incoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>No incoming exchange requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incoming.map(renderExchangeCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          {loadingOutgoing ? (
            <div>Loading outgoing requests...</div>
          ) : outgoing.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>No outgoing exchange requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {outgoing.map(renderExchangeCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <div>Loading history...</div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>No past exchanges found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.map(renderExchangeCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
