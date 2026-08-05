import type { ExchangeEvent } from "@reusedo/validation";

interface TimelineProps {
  events: ExchangeEvent[];
}

export const ExchangeTimeline = ({ events }: TimelineProps) => {
  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {events.map((event) => (
        <div
          key={event.id}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Timeline Event</title>
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-slate-900 capitalize">
                {event.action.replace("_", " ")}
              </div>
              <time className="text-xs font-medium text-slate-500">
                {new Date(event.created_at).toLocaleString()}
              </time>
            </div>
            <div className="text-sm text-slate-500">
              {event.action === "created" && "The exchange request was initiated."}
              {event.action === "counter_offered" &&
                "A new counter offer was proposed with updated products."}
              {event.action === "accepted" &&
                "The exchange was accepted by the recipient! Both parties are now preparing for shipment."}
              {event.action === "rejected" && "The exchange was rejected."}
              {event.action === "cancelled" && "The exchange was cancelled."}
              {event.action === "expired" && "The exchange has automatically expired."}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
