// src/components/DebugPanel.tsx - Debug panel for transaction testing
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { api } from '@/lib/api';

const DebugPanel = () => {
  const { userData } = useAuth();
  const { userStats, refreshUserData } = useUserData();
  const [apiResults, setApiResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testApiEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(true);
    try {
      console.log(`Testing ${name}...`);
      const result = await apiCall();
      console.log(`${name} result:`, result);
      setApiResults(prev => ({
        ...prev,
        [name]: { success: true, data: result, timestamp: new Date().toISOString() }
      }));
    } catch (error: any) {
      console.error(`${name} failed:`, error);
      setApiResults(prev => ({
        ...prev,
        [name]: { success: false, error: error.message, timestamp: new Date().toISOString() }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    await testApiEndpoint('Health Check', () => api.health.check());
    await testApiEndpoint('Get Profile', () => api.auth.getProfile());
    await testApiEndpoint('Get Transactions', () => api.transactions.getAll());
    await testApiEndpoint('Get Transaction Stats', () => api.transactions.getStats());
  };

  const clearResults = () => {
    setApiResults({});
  };

  const formatResult = (result: any) => {
    if (result.success) {
      return (
        <div className="text-green-700">
          <Badge className="bg-green-100 text-green-800 mb-2">SUCCESS</Badge>
          <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result.data, null, 2)}
          </pre>
          <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
        </div>
      );
    } else {
      return (
        <div className="text-red-700">
          <Badge className="bg-red-100 text-red-800 mb-2">ERROR</Badge>
          <p className="text-sm bg-red-50 p-2 rounded">{result.error}</p>
          <p className="text-xs text-gray-500 mt-1">{result.timestamp}</p>
        </div>
      );
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">🔧 Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-semibold text-blue-900 mb-2">Current User Info</h4>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> {userData?.id || 'Not available'}</p>
            <p><strong>Email:</strong> {userData?.email || 'Not available'}</p>
            <p><strong>Wallet Balance:</strong> {userData?.walletBalance || 0} coins</p>
            <p><strong>Transactions Count:</strong> {userStats.transactions?.length || 0}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Running Tests...' : 'Run All API Tests'}
          </Button>
          <Button 
            onClick={() => testApiEndpoint('Get Transactions', () => api.transactions.getAll())}
            disabled={loading}
            variant="outline"
          >
            Test Transactions API
          </Button>
          <Button 
            onClick={refreshUserData}
            disabled={loading}
            variant="outline"
          >
            Refresh User Data
          </Button>
          <Button 
            onClick={clearResults}
            variant="outline"
            className="text-gray-600"
          >
            Clear Results
          </Button>
        </div>

        {/* API Results */}
        {Object.keys(apiResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">API Test Results</h4>
            {Object.entries(apiResults).map(([name, result]) => (
              <div key={name} className="border border-gray-200 rounded p-3">
                <h5 className="font-medium mb-2">{name}</h5>
                {formatResult(result)}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-2">How to Use</h4>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Click "Run All API Tests" to check if backend is working</li>
            <li>Make a payment through the Add Coins page</li>
            <li>Come back here and click "Test Transactions API" to see if the transaction was created</li>
            <li>Check the console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;