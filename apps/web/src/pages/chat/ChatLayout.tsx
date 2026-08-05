import { Outlet, useParams } from "react-router";
import { ConversationList } from "./ConversationList";

export const ChatLayout = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto border rounded-xl overflow-hidden mt-4 shadow-sm bg-background">
      {/* Sidebar - hidden on mobile if conversation is selected */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${id ? "hidden md:block" : "block"}`}>
        <ConversationList />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${!id ? "hidden md:flex" : "flex"}`}>
        <Outlet />
      </div>
    </div>
  );
};
