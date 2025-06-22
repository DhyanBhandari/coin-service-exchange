
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Coins, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConversionRequest {
  id: string;
  orgName: string;
  orgId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  dateRequested: string;
  dateProcessed?: string;
  reason?: string;
}

const AdminConversions = () => {
  const [conversions, setConversions] = useState<ConversionRequest[]>([]);
  const [selectedConversion, setSelectedConversion] = useState<ConversionRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const { toast } = useToast();

  useEffect(() => {
    // Load conversion requests from localStorage or use demo data
    const savedConversions = localStorage.getItem('adminConversions');
    if (savedConversions) {
      setConversions(JSON.parse(savedConversions));
    } else {
      // Demo data
      const demoConversions: ConversionRequest[] = [
        {
          id: '1',
          orgName: 'TechCorp Solutions',
          orgId: 'org1',
          amount: 1500,
          currency: 'INR',
          status: 'pending',
          dateRequested: '2024-01-20'
        },
        {
          id: '2',
          orgName: 'DesignStudio Pro',
          orgId: 'org2',
          amount: 800,
          currency: 'USD',
          status: 'pending',
          dateRequested: '2024-01-19'
        },
        {
          id: '3',
          orgName: 'ContentCreators Inc',
          orgId: 'org3',
          amount: 1200,
          currency: 'INR',
          status: 'approved',
          dateRequested: '2024-01-15',
          dateProcessed: '2024-01-16'
        },
        {
          id: '4',
          orgName: 'MarketingPro',
          orgId: 'org4',
          amount: 500,
          currency: 'EUR',
          status: 'rejected',
          dateRequested: '2024-01-12',
          dateProcessed: '2024-01-13',
          reason: 'Insufficient documentation'
        }
      ];
      setConversions(demoConversions);
      localStorage.setItem('adminConversions', JSON.stringify(demoConversions));
    }
  }, []);

  const handleAction = (conversion: ConversionRequest, action: 'approve' | 'reject') => {
    setSelectedConversion(conversion);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedConversion) return;

    const updatedConversions = conversions.map(conversion =>
      conversion.id === selectedConversion.id
        ? {
            ...conversion,
            status: actionType === 'approve' ? 'approved' as const : 'rejected' as const,
            dateProcessed: new Date().toISOString().split('T')[0],
            reason: actionType === 'reject' ? 'Administrative decision' : undefined
          }
        : conversion
    );

    setConversions(updatedConversions);
    localStorage.setItem('adminConversions', JSON.stringify(updatedConversions));

    toast({
      title: `Conversion ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The conversion request has been ${actionType}d.`,
    });

    setIsDialogOpen(false);
    setSelectedConversion(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  const pendingConversions = conversions.filter(c => c.status === 'pending');
  const totalPendingAmount = pendingConversions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Conversion Requests</h1>
            <p className="text-gray-600">Approve or reject coin-to-fiat conversion requests</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingConversions.length}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Coins className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPendingAmount}</div>
              <p className="text-xs text-muted-foreground">Coins awaiting conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversions.length}</div>
              <p className="text-xs text-muted-foreground">All time conversions</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Section */}
        {pendingConversions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                Pending Approvals ({pendingConversions.length})
              </CardTitle>
              <CardDescription>
                These requests require your immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingConversions.map((conversion) => (
                  <div key={conversion.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Coins className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{conversion.orgName}</h3>
                          <p className="text-sm text-gray-600">
                            {conversion.amount} Coins → {getCurrencySymbol(conversion.currency)}{conversion.amount}
                          </p>
                          <p className="text-xs text-gray-500">Requested: {conversion.dateRequested}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(conversion, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(conversion, 'reject')}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Conversion Requests */}
        <Card>
          <CardHeader>
            <CardTitle>All Conversion Requests</CardTitle>
            <CardDescription>Complete history of conversion requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversions.map((conversion) => (
                <div key={conversion.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {getStatusIcon(conversion.status)}
                      </div>
                      <div>
                        <h3 className="font-medium">{conversion.orgName}</h3>
                        <p className="text-sm text-gray-600">
                          {conversion.amount} Coins → {getCurrencySymbol(conversion.currency)}{conversion.amount}
                        </p>
                        <div className="text-xs text-gray-500">
                          <p>Requested: {conversion.dateRequested}</p>
                          {conversion.dateProcessed && (
                            <p>Processed: {conversion.dateProcessed}</p>
                          )}
                          {conversion.reason && (
                            <p>Reason: {conversion.reason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(conversion.status)}>
                        {conversion.status}
                      </Badge>
                      {conversion.status === 'pending' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleAction(conversion, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(conversion, 'reject')}
                            className="text-red-600"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {conversions.length === 0 && (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversion requests</h3>
                  <p className="text-gray-600">No organizations have requested coin conversions yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Conversion Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType} this conversion request?
            </DialogDescription>
          </DialogHeader>
          {selectedConversion && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Organization:</strong> {selectedConversion.orgName}</p>
                <p><strong>Amount:</strong> {selectedConversion.amount} Coins</p>
                <p><strong>Currency:</strong> {getCurrencySymbol(selectedConversion.currency)}{selectedConversion.amount}</p>
                <p><strong>Requested:</strong> {selectedConversion.dateRequested}</p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConversions;
