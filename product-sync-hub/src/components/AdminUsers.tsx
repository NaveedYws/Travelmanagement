import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserPlus, Trash2, ShieldCheck, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Hotel, ShoppingBag, Calendar, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, addYears, subDays } from "date-fns";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
  { value: "travel", label: "Travel Agency", icon: Plane },
  { value: "hotel", label: "Hotel Business", icon: Hotel },
  { value: "products", label: "Products / Store", icon: ShoppingBag },
] as const;

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    business_type: "products"
  });

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: User[] }>("/api/admin/users.php");
      setUsers(data.users);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId: number, action: string, value?: any) => {
    try {
      await api.post("/api/admin/update-user.php", {
        user_id: userId,
        action,
        ...value
      });
      toast.success("User updated successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  };
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/register.php", newUser);
      toast.success("User created successfully! They will need to verify via OTP.");
      setIsCreateDialogOpen(false);
      setNewUser({ email: "", password: "", business_type: "products" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading users...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500">Manage registered users and permissions.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 gap-2">
              <UserPlus className="w-4 h-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Fill in the details to register a new user manually.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email Address</Label>
                <Input 
                  id="new-email" 
                  type="email" 
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select 
                  value={newUser.business_type} 
                  onValueChange={(v) => setNewUser({...newUser, business_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">User</TableHead>
                <TableHead className="font-semibold text-slate-700">Business</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Subscription</TableHead>
                <TableHead className="font-semibold text-slate-700">Role</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.email}</div>
                        <div className="text-xs text-slate-400">ID: {user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-slate-50 text-slate-600 border-slate-200">
                      {user.business_type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={user.is_verified} 
                        onCheckedChange={(checked) => handleUpdateUser(user.id, "verify", { is_verified: checked })}
                      />
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        user.is_verified ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {user.is_verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Created: {user.created_at ? format(new Date(user.created_at), "dd MMM yyyy") : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                        <Clock className="w-3 h-3" />
                        <span>Renewal: {user.created_at ? format(subDays(addYears(new Date(user.created_at), 1), 1), "dd MMM yyyy") : "N/A"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="capitalize text-sm font-medium text-slate-700">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleUpdateUser(user.id, "set_role", { role: user.role === 'admin' ? 'user' : 'admin' })}
                      >
                        Change Role
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this user?")) {
                            handleUpdateUser(user.id, "delete");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
