
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Building2, Shield, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'org' | 'admin';
  status: 'active' | 'suspended';
  joinDate: string;
  walletBalance?: number;
  servicesOffered?: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // Load users from localStorage or use demo data
    const savedUsers = localStorage.getItem('adminUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Demo data
      const demoUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          status: 'active',
          joinDate: '2024-01-15',
          walletBalance: 450
        },
        {
          id: '2',
          name: 'TechCorp Solutions',
          email: 'contact@techcorp.com',
          role: 'org',
          status: 'active',
          joinDate: '2024-01-10',
          servicesOffered: 8
        },
        {
          id: '3',
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'user',
          status: 'active',
          joinDate: '2024-01-20',
          walletBalance: 120
        },
        {
          id: '4',
          name: 'DesignStudio Pro',
          email: 'hello@designstudio.com',
          role: 'org',
          status: 'suspended',
          joinDate: '2024-01-05',
          servicesOffered: 3
        }
      ];
      setUsers(demoUsers);
      localStorage.setItem('adminUsers', JSON.stringify(demoUsers));
    }
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleStatusChange = (userId: string, newStatus: 'active' | 'suspended') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "User Status Updated",
      description: `User has been ${newStatus}.`,
    });
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'org' | 'admin') => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "User Role Updated",
      description: `User role has been changed to ${newRole}.`,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'org': return <Building2 className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'org': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all platform users and organizations</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="org">Organizations</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Joined: {user.joinDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {user.role === 'user' && user.walletBalance !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.walletBalance} Coins</p>
                          <p className="text-xs text-gray-600">Wallet Balance</p>
                        </div>
                      )}
                      
                      {user.role === 'org' && user.servicesOffered !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.servicesOffered} Services</p>
                          <p className="text-xs text-gray-600">Offered</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col space-y-2">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Select 
                          value={user.role} 
                          onValueChange={(value: 'user' | 'org' | 'admin') => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="org">Org</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(
                            user.id, 
                            user.status === 'active' ? 'suspended' : 'active'
                          )}
                          className={user.status === 'suspended' ? 'text-green-600' : 'text-red-600'}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
