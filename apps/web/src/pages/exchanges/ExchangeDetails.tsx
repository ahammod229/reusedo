import { ExchangeService } from "@reusedo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";

import { Button } from "@reusedo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@reusedo/ui";
import { Badge } from "@reusedo/ui";
import { useToast } from "@reusedo/ui";
import { useState } from "react";
import { CounterOfferModal } from "./components/CounterOfferModal";
import { ExchangeTimeline } from "./components/ExchangeTimeline";

export const ExchangeDetails = () => {
  const { id } = useParams<{ id: string }>();
  // const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);

  const { data: exchange, isLoading: loadingExchange } = useQuery({
    queryKey: ["exchange", id],
    queryFn: () => ExchangeService.getExchangeById(id as string),
    enabled: !!id,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["exchange", id, "events"],
    queryFn: () => ExchangeService.getExchangeEvents(id as string),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: () => ExchangeService.acceptExchange(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
      queryClient.invalidateQueries({ queryKey: ["exchange", id, "events"] });
      toast({ title: "Exchange Accepted!", description: "You are now ready for shipping." });
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => ExchangeService.rejectExchange(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
      queryClient.invalidateQueries({ queryKey: ["exchange", id, "events"] });
      toast({ title: "Exchange Rejected", description: "This exchange is now closed." });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => ExchangeService.cancelExchange(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange", id] });
      queryClient.invalidateQueries({ queryKey: ["exchange", id, "events"] });
      toast({ title: "Exchange Cancelled" });
    },
  });

  if (loadingExchange || loadingEvents)
    return <div className="p-8 text-center">Loading exchange details...</div>;
  if (!exchange) return <div className="p-8 text-center">Exchange not found</div>;

  const isPendingOrCounter = exchange.status === "pending" || exchange.status === "counter_offered";

  // Who's turn is it to act? If it's pending, the recipient acts.
  // If it's counter offered, the other party acts (we'd need event history to know who exactly,
  // but for simplicity we assume recipient can always accept a pending offer).
  // const isRecipient = false; // TODO: Check actual user ID
  // const isRequester = false; // TODO: Check actual user ID

  const getStatusBadgeVariant = (status: string) => {
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Exchange Details
            <Badge variant={getStatusBadgeVariant(exchange.status)} className="capitalize text-sm">
              {exchange.status.replace("_", " ")}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Created on {new Date(exchange.created_at).toLocaleDateString()}
          </p>
        </div>

        {isPendingOrCounter && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCounterModalOpen(true)}>
              Counter Offer
            </Button>

            {/* Very basic role check for accept/reject */}
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
            <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              Accept
            </Button>
          </div>
        )}

        {/* Cancel button if not finished */}
        {exchange.status === "accepted" && (
          <Button
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Cancel Exchange
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Offered Products</CardTitle>
            <CardDescription>Products being given</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {exchange.offered_product_ids.map((id) => (
                <li key={id} className="text-sm font-medium">
                  {id}
                </li> // In a real app, we'd fetch product details
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requested Products</CardTitle>
            <CardDescription>Products being asked for</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {exchange.requested_product_ids.map((id) => (
                <li key={id} className="text-sm font-medium">
                  {id}
                </li> // In a real app, we'd fetch product details
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Timeline</h2>
        <Card className="p-6">
          <ExchangeTimeline events={events} />
        </Card>
      </div>

      {isCounterModalOpen && (
        <CounterOfferModal exchange={exchange} onClose={() => setIsCounterModalOpen(false)} />
      )}
    </div>
  );
};
