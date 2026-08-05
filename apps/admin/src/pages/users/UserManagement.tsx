import * as React from "react";
import { AdminService } from "@reusedo/api-client";
import { Button, Card, CardContent } from "@reusedo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, User } from "lucide-react";

export const UserManagement = () => {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin_users", page, search],
    queryFn: () => AdminService.getUsers(page, search),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string | null }) => AdminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    const role = newRole === "user" ? null : newRole;
    if (confirm(`Are you sure you want to change this user's role?`)) {
      updateRoleMutation.mutate({ userId, role });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                      Error loading users
                    </td>
                  </tr>
                ) : data?.users?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  data?.users?.map(
                    (user: {
                      id: string;
                      avatar_url?: string;
                      display_name: string;
                      username: string;
                      created_at: string;
                      admin_role?: string;
                    }) => (
                      <tr
                        key={user.id}
                        className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              loading="lazy"
                              src={user.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full bg-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-emerald-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{user.display_name}</div>
                            <div className="text-xs text-slate-500">@{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {user.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.admin_role === "super_admin"
                                ? "bg-purple-100 text-purple-700"
                                : user.admin_role
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {user.admin_role ? (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" /> {user.admin_role.replace("_", " ")}
                              </span>
                            ) : (
                              "user"
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="text-sm border border-slate-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={user.admin_role || "user"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updateRoleMutation.isPending}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="content_manager">Content Manager</option>
                            <option value="support_agent">Support Agent</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          {data?.total > 20 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{" "}
                <span className="font-medium">{Math.min(page * 20, data.total)}</span> of{" "}
                <span className="font-medium">{data.total}</span> users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= data.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
