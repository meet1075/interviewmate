"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// User interface matching the API response
export interface AdminUser {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  joinDate: string;
  lastActive: string;
  sessionsCompleted: number;
  averageScore: number;
  totalPoints: number;
  badges: string[];
  bookmarkedQuestions: string[];
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
}

export default function ManageUsersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]); // Store all users
  const [users, setUsers] = useState<AdminUser[]>([]); // Display filtered users
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, suspended: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Client-side filtering function
  const filterUsers = (userList: AdminUser[]) => {
    return userList.filter(user => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      
      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  };

  // Update displayed users when filters change
  useEffect(() => {
    const filtered = filterUsers(allUsers);
    setUsers(filtered);
  }, [allUsers, searchQuery, statusFilter, roleFilter]);

  // Debounced search - removed as we're doing client-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      const filtered = filterUsers(allUsers);
      setUsers(filtered);
    }, 300); // Reduced delay for better UX
    return () => clearTimeout(timer);
  }, [searchQuery, allUsers]);

  // Fetch users from API (only once on load)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manageuser?limit=1000`); // Get all users
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({ title: "Error", description: "Unauthorized access", variant: "destructive" });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setAllUsers(data.users); // Store all users
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Update user status with optimistic UI updates
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    // Find the user to get current status
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const oldStatus = user.status;
    
    // Optimistic update - update both allUsers immediately
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    // Update stats optimistically
    setStats(prev => {
      const newStats = { ...prev };
      
      if (oldStatus === 'active' && newStatus === 'suspended') {
        newStats.active -= 1;
        newStats.suspended += 1;
      } else if (oldStatus === 'suspended' && newStatus === 'active') {
        newStats.active += 1;
        newStats.suspended -= 1;
      }
      
      return newStats;
    });

    try {
      const response = await fetch(`/api/manageuser/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      toast({ title: "Success", description: `User status updated to ${newStatus}` });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
      
      // Revert optimistic update on error
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: oldStatus } : u));
      
      // Revert stats on error
      setStats(prev => {
        const newStats = { ...prev };
        if (oldStatus === 'active' && newStatus === 'suspended') {
          newStats.active += 1;
          newStats.suspended -= 1;
        } else if (oldStatus === 'suspended' && newStatus === 'active') {
          newStats.active -= 1;
          newStats.suspended += 1;
        }
        return newStats;
      });
    }
  };

  // Redirect if not an admin
  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchUsers();
    }
  }, [isLoaded, user, router]);

  // Refetch when component loads and user is admin
  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchUsers();
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div className="container py-8 text-center"><p>Loading...</p></div>;
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return <div className="container py-8 text-center"><p>Access Denied</p></div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-green-500/80">Active</Badge>;
      case "suspended": return <Badge variant="destructive">Suspended</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => (
    <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">{role}</Badge>
  );

  return (
    <div className="container py-8 space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">View, search, and manage all platform users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{stats.total}</div><p className="text-sm text-muted-foreground">Total Users</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-500">{stats.active}</div><p className="text-sm text-muted-foreground">Active Users</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-destructive">{stats.suspended}</div><p className="text-sm text-muted-foreground">Suspended</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input 
                placeholder="Search users by name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Join Date</TableHead>
                    <TableHead className="w-[120px]">Performance</TableHead>
                    <TableHead className="w-[160px] text-right">Status Toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: AdminUser) => (
                    <TableRow key={u.id}>
                      <TableCell className="w-[250px]">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary-foreground">{u.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px]">{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="w-[120px]">{getStatusBadge(u.status)}</TableCell>
                      <TableCell className="w-[120px] text-sm">{new Date(u.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell className="w-[120px]">
                        {u.role === 'user' ? (
                          <div className="text-sm">
                            <div className="font-medium">{u.averageScore}% avg</div>
                            <div className="text-muted-foreground">{u.sessionsCompleted} sessions</div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">N/A</div>
                        )}
                      </TableCell>
                      <TableCell className="w-[160px]">
                        <div className="flex items-center justify-end space-x-2">
                          {u.role === 'admin' ? (
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm text-muted-foreground">Admin</Label>
                            </div>
                          ) : (
                            <>
                              <Switch
                                id={`status-${u.id}`}
                                checked={u.status === 'active'}
                                onCheckedChange={(checked) => updateUserStatus(u.id, checked ? 'active' : 'suspended')}
                              />
                              <Label htmlFor={`status-${u.id}`} className="text-sm cursor-pointer w-16 text-right">
                                {u.status === 'active' ? 'Active' : 'Suspended'}
                              </Label>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
