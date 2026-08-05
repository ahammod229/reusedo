import { ExchangeService } from "@reusedo/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@reusedo/ui";
import { Button } from "@reusedo/ui";
import { useToast } from "@reusedo/ui";
import type { CounterOfferData, Exchange } from "@reusedo/validation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface CounterOfferModalProps {
  exchange: Exchange;
  onClose: () => void;
}

export const CounterOfferModal = ({ exchange, onClose }: CounterOfferModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For the sake of this milestone, we will simulate counter offering
  // by just keeping the same products (as a stub) or allowing the user
  // to input raw UUIDs in a real scenario.

  const [offered] = useState<string[]>(exchange.requested_product_ids); // Swapping roles implicitly in a counter
  const [requested] = useState<string[]>(exchange.offered_product_ids);

  const counterMutation = useMutation({
    mutationFn: (data: CounterOfferData) => ExchangeService.counterOffer(exchange.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange", exchange.id] });
      queryClient.invalidateQueries({ queryKey: ["exchange", exchange.id, "events"] });
      toast({ title: "Counter offer submitted!" });
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Counter Offer</DialogTitle>
          <DialogDescription>
            Propose a different set of products for this exchange.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            (In a full implementation, you would select products from your inventory and the other
            user's inventory here).
          </p>
          <div className="space-y-2">
            <div className="font-semibold text-sm">Products you will give:</div>
            <div className="bg-muted p-2 rounded text-xs">{offered.join(", ")}</div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="font-semibold text-sm">Products you want:</div>
            <div className="bg-muted p-2 rounded text-xs">{requested.join(", ")}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              counterMutation.mutate({
                offered_product_ids: offered,
                requested_product_ids: requested,
              })
            }
            disabled={counterMutation.isPending}
          >
            {counterMutation.isPending ? "Submitting..." : "Submit Counter Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
