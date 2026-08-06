import { ShippingService } from "@reusedo/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@reusedo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Package, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

export const ShipmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");

  const {
    data: shipment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => ShippingService.getShipment(id || ""),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      status?:
        | "pending"
        | "processing"
        | "shipped"
        | "in_transit"
        | "delivered"
        | "cancelled"
        | "returned";
      tracking_number?: string;
    }) => ShippingService.updateShipment(id || "", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      queryClient.invalidateQueries({ queryKey: ["my_shipments"] });
    },
  });

  if (isLoading)
    return <div className="p-8 text-center text-slate-500">Loading shipment details...</div>;
  if (error || !shipment)
    return <div className="p-8 text-center text-red-500">Failed to load shipment details.</div>;

  const handleUpdateTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      updateMutation.mutate({ tracking_number: trackingNumber.trim(), status: "shipped" });
    }
  };

  const handleMarkDelivered = () => {
    updateMutation.mutate({ status: "delivered" });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/shipping" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Shipments
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-emerald-600" />
          Shipment Details
        </h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
          {shipment.status.replace("_", " ")}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Exchange ID</p>
              <p className="font-mono text-sm">{shipment.exchange_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Created At</p>
              <p>{new Date(shipment.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tracking Number</p>
              <p className="font-medium">{shipment.tracking_number || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Carrier</p>
              <p>{shipment.carrier || "Not specified"}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500 mb-2">Shipping Address</p>
            <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-700">
              <p>{String(shipment.shipping_address.street || "")}</p>
              <p>
                {String(shipment.shipping_address.city || "")},{" "}
                {String(shipment.shipping_address.state || "")}{" "}
                {String(shipment.shipping_address.postal_code || "")}
              </p>
              <p>{String(shipment.shipping_address.country || "")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions based on status */}
      {shipment.status !== "delivered" && shipment.status !== "cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle>Update Shipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!shipment.tracking_number && (
              <form onSubmit={handleUpdateTracking} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label
                    htmlFor="trackingNumber"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Add Tracking Number
                  </label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                <Button type="submit" disabled={!trackingNumber.trim() || updateMutation.isPending}>
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Shipped
                </Button>
              </form>
            )}

            {shipment.status === "shipped" || shipment.status === "in_transit" ? (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 mb-4">Has the package arrived safely?</p>
                <Button
                  onClick={handleMarkDelivered}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
