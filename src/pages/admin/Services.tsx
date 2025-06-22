
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, Eye, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  orgName: string;
  orgId: string;
  status: 'active' | 'inactive' | 'pending';
  bookings: number;
  dateCreated: string;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    // Load services from localStorage or use demo data
    const savedServices = localStorage.getItem('adminServices');
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      // Demo data
      const demoServices: Service[] = [
        {
          id: '1',
          title: 'Website Development',
          description: 'Complete website development with modern design',
          price: 500,
          category: 'technology',
          orgName: 'TechCorp Solutions',
          orgId: 'org1',
          status: 'active',
          bookings: 12,
          dateCreated: '2024-01-10'
        },
        {
          id: '2',
          title: 'Logo Design',
          description: 'Professional logo design for your brand',
          price: 150,
          category: 'design',
          orgName: 'DesignStudio Pro',
          orgId: 'org2',
          status: 'active',
          bookings: 8,
          dateCreated: '2024-01-15'
        },
        {
          id: '3',
          title: 'SEO Optimization',
          description: 'Improve your website search rankings',
          price: 300,
          category: 'marketing',
          orgName: 'TechCorp Solutions',
          orgId: 'org1',
          status: 'pending',
          bookings: 0,
          dateCreated: '2024-01-20'
        },
        {
          id: '4',
          title: 'Content Writing',
          description: 'Professional content writing services',
          price: 100,
          category: 'marketing',
          orgName: 'ContentCreators Inc',
          orgId: 'org3',
          status: 'inactive',
          bookings: 5,
          dateCreated: '2024-01-12'
        }
      ];
      setServices(demoServices);
      localStorage.setItem('adminServices', JSON.stringify(demoServices));
    }
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.orgName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStatusChange = (serviceId: string, newStatus: 'active' | 'inactive') => {
    const updatedServices = services.map(service =>
      service.id === serviceId ? { ...service, status: newStatus } : service
    );
    setServices(updatedServices);
    localStorage.setItem('adminServices', JSON.stringify(updatedServices));
    
    toast({
      title: "Service Status Updated",
      description: `Service has been ${newStatus}.`,
    });
  };

  const handleApprove = (serviceId: string) => {
    const updatedServices = services.map(service =>
      service.id === serviceId ? { ...service, status: 'active' as const } : service
    );
    setServices(updatedServices);
    localStorage.setItem('adminServices', JSON.stringify(updatedServices));
    
    toast({
      title: "Service Approved",
      description: "The service has been approved and is now active.",
    });
  };

  const handleDelete = (serviceId: string) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
    localStorage.setItem('adminServices', JSON.stringify(updatedServices));
    
    toast({
      title: "Service Deleted",
      description: "The service has been permanently removed.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology': return 'bg-blue-100 text-blue-800';
      case 'design': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-green-100 text-green-800';
      case 'consulting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600">Monitor and manage all platform services</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by service name or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription className="mt-1">{service.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Organization</span>
                    <span className="font-medium">{service.orgName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price</span>
                    <span className="font-semibold text-blue-600">{service.price} Coins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Category</span>
                    <Badge className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bookings</span>
                    <span className="font-medium">{service.bookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm">{service.dateCreated}</span>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    {service.status === 'pending' ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(service.id)}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleStatusChange(service.id, service.status === 'active' ? 'inactive' : 'active')}
                        className="flex-1"
                      >
                        {service.status === 'active' ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">No services match your current filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminServices;
