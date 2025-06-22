
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive';
  bookings: number;
}

const OrgServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load services from localStorage
    const savedServices = localStorage.getItem('orgServices');
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
          status: 'active',
          bookings: 12
        },
        {
          id: '2',
          title: 'Logo Design',
          description: 'Professional logo design for your brand',
          price: 150,
          category: 'design',
          status: 'active',
          bookings: 8
        }
      ];
      setServices(demoServices);
      localStorage.setItem('orgServices', JSON.stringify(demoServices));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const newService: Service = {
      id: editingService?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price),
      category: formData.category,
      status: 'active',
      bookings: editingService?.bookings || 0
    };

    let updatedServices;
    if (editingService) {
      updatedServices = services.map(s => s.id === editingService.id ? newService : s);
      toast({
        title: "Service Updated",
        description: "Your service has been updated successfully.",
      });
    } else {
      updatedServices = [...services, newService];
      toast({
        title: "Service Created",
        description: "Your new service has been created successfully.",
      });
    }

    setServices(updatedServices);
    localStorage.setItem('orgServices', JSON.stringify(updatedServices));
    
    // Reset form
    setFormData({ title: '', description: '', price: '', category: '' });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      category: service.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedServices = services.filter(s => s.id !== id);
    setServices(updatedServices);
    localStorage.setItem('orgServices', JSON.stringify(updatedServices));
    toast({
      title: "Service Deleted",
      description: "The service has been removed successfully.",
    });
  };

  const toggleStatus = (id: string) => {
    const updatedServices = services.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } as Service : s
    );
    setServices(updatedServices);
    localStorage.setItem('orgServices', JSON.stringify(updatedServices));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
              <p className="text-gray-600">Manage your service offerings</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingService(null);
                  setFormData({ title: '', description: '', price: '', category: '' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                  <DialogDescription>
                    {editingService ? 'Update your service details' : 'Create a new service offering'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Service Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter service title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your service"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (Coins)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingService ? 'Update Service' : 'Create Service'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-600 mb-4">Create your first service to start earning coins</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    </div>
                    <Badge 
                      className={service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="font-semibold text-blue-600">{service.price} Coins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bookings</span>
                      <span className="font-medium">{service.bookings}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleStatus(service.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {service.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgServices;
