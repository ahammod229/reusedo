import { useQuery } from "@tanstack/react-query";
import { ShippingService } from "@reusedo/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@reusedo/ui";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router";

export const ShippingDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my_shipments"],
    queryFn: () => ShippingService.getUserShipments(),
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading shipments...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load shipments.</div>;

  const shipments = data?.shipments || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'shipped':
      case 'in_transit': return <Truck className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <Package className="h-6 w-6 text-emerald-600" />
        My Shipments
      </h1>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>You have no active or past shipments.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shipments.map(shipment => (
            <Card key={shipment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {getStatusIcon(shipment.status)}
                  <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                </CardTitle>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(shipment.created_at).toLocaleDateString()}
                </span>
              </CardHeader>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Exchange ID: <span className="font-mono text-xs">{shipment.exchange_id}</span></p>
                  <p className="text-sm text-slate-500 mt-1">
                    {shipment.tracking_number ? `Tracking: ${shipment.tracking_number}` : 'Tracking not available yet'}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/shipping/${shipment.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
