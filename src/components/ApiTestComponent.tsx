// src/components/ApiTestComponent.tsx - Component to test API integration
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const ApiTestComponent = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { name, status, message, data }];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const healthURL = baseURL.replace('/api/v1', '/health');

    // Test 1: Health Check
    updateTest('Health Check', 'pending', 'Checking server health...');
    try {
      const response = await fetch(healthURL);
      if (response.ok) {
        const data = await response.json();
        updateTest('Health Check', 'success', `Server is healthy (${response.status})`, data);
      } else {
        updateTest('Health Check', 'error', `Server returned ${response.status}`);
      }
    } catch (error) {
      updateTest('Health Check', 'error', `Network error: ${error}`);
    }

    // Test 2: CORS Check
    updateTest('CORS Check', 'pending', 'Testing CORS configuration...');
    try {
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'OPTIONS',
      });
      updateTest('CORS Check', 'success', `CORS configured (${response.status})`);
    } catch (error) {
      updateTest('CORS Check', 'error', `CORS error: ${error}`);
    }

    // Test 3: Registration Test
    updateTest('Registration', 'pending', 'Testing registration endpoint...');
    try {
      const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'testpassword123',
        role: 'user'
      };

      const response = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        updateTest('Registration', 'error', `Invalid JSON response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (response.ok && data.success) {
        updateTest('Registration', 'success', 'Registration successful', data);
      } else {
        updateTest('Registration', 'error', data.message || `Registration failed (${response.status})`);
      }
    } catch (error) {
      updateTest('Registration', 'error', `Registration error: ${error}`);
    }

    // Test 4: Login Test (with demo credentials)
    updateTest('Login', 'pending', 'Testing login with demo credentials...');
    try {
      const loginData = {
        email: 'admin@erthaexchange.com',
        password: 'admin123'
      };

      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        updateTest('Login', 'error', `Invalid JSON response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (response.ok && data.success) {
        updateTest('Login', 'success', 'Login successful', { user: data.data?.user });
      } else {
        updateTest('Login', 'error', data.message || `Login failed (${response.status})`);
      }
    } catch (error) {
      updateTest('Login', 'error', `Login error: ${error}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-blue-600">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          API Integration Test Suite
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              Click "Run Tests" to test the API integration
            </div>
          )}
          
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(test.status)}
                  <h3 className="font-medium">{test.name}</h3>
                </div>
                {getStatusBadge(test.status)}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{test.message}</p>
              
              {test.data && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer">View Details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Test Configuration</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'https://coin-service-exchange-production.up.railway.app/api/v1'}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p><strong>Health URL:</strong> {import.meta.env.VITE_API_URL?.replace('/api/v1', '/health') || 'https://coin-service-exchange-production.up.railway.app/health'}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting Tips</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• Ensure backend server is running on port 5000</p>
            <p>• Check that database is connected and migrated</p>
            <p>• Verify CORS configuration allows your frontend origin</p>
            <p>• Check browser console for additional error details</p>
            <p>• Test backend endpoints directly with curl if tests fail</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTestComponent;