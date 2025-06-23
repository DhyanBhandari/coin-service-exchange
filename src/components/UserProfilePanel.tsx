
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Wallet, 
  Plus, 
  ShoppingBag, 
  MessageSquare, 
  RotateCcw, 
  Settings, 
  LogOut,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TopUpCoinsModal from './TopUpCoinsModal';

interface Order {
  id: number;
  serviceName: string;
  date: string;
  amount: number;
  status: 'completed' | 'active' | 'expired';
  feedbackSubmitted?: boolean;
}

const UserProfilePanel = () => {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      serviceName: 'Living Spaces',
      date: '2024-01-15',
      amount: 100,
      status: 'completed',
      feedbackSubmitted: false
    },
    {
      id: 2,
      serviceName: 'Tech Services',
      date: '2024-01-10',
      amount: 150,
      status: 'active',
      feedbackSubmitted: false
    },
    {
      id: 3,
      serviceName: 'Organic Products',
      date: '2024-01-05',
      amount: 75,
      status: 'expired',
      feedbackSubmitted: true
    }
  ]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const handleReorder = (order: Order) => {
    toast({
      title: "Reorder Initiated",
      description: `Redirecting to ${order.serviceName}...`,
    });
    // Navigate to the specific service page
    const serviceSlug = order.serviceName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/services/${serviceSlug}`);
    setIsOpen(false);
  };

  const handleFeedback = (order: Order) => {
    navigate(`/feedback?service=${encodeURIComponent(order.serviceName)}&orderId=${order.id}`);
    setIsOpen(false);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!user) {
    return (
      <Link to="/login">
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Login
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Wallet Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <span className="text-2xl font-bold">{user.walletBalance || 0}</span>
                    <span className="text-gray-500">ErthaCoins</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setShowTopUpModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Top Up
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Orders Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Past Orders
              </h3>
              
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    You haven't made any purchases yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{order.serviceName}</p>
                          <p className="text-sm text-gray-500">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{order.amount} coins</p>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        {order.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReorder(order)}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reorder
                          </Button>
                        )}
                        
                        {order.status === 'expired' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            title="Service expired"
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reorder
                          </Button>
                        )}
                        
                        {order.feedbackSubmitted ? (
                          <Button size="sm" variant="outline" disabled>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Thanks for your feedback!
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeedback(order)}
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Leave Feedback
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Menu Items */}
            <div className="space-y-2">
              <Link to="/dashboard/user" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-3" />
                  My Dashboard
                </Button>
              </Link>
              
              <Link to="/transactions" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingBag className="h-4 w-4 mr-3" />
                  My Transactions
                </Button>
              </Link>
              
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TopUpCoinsModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        currentBalance={user.walletBalance || 0}
        onSuccess={(newBalance) => {
          setUser({ ...user, walletBalance: newBalance });
          localStorage.setItem('user', JSON.stringify({ ...user, walletBalance: newBalance }));
        }}
      />
    </>
  );
};

export default UserProfilePanel;
