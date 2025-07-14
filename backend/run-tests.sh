#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data storage
let testData = {
  tokens: {},
  users: {},
  services: {},
  transactions: {},
  conversions: {}
};

// Test results storage
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

const logResult = (test, status, message, data = null) => {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${test}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${test}: ${message}`);
  }
  
  testResults.details.push({
    test,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: url.startsWith('http') ? url : `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test Functions

async function testHealthCheck() {
  log('Testing Health Check...');
  
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  if (result.success) {
    logResult('Health Check', 'PASS', 'Server is healthy', result.data);
  } else {
    logResult('Health Check', 'FAIL', `Health check failed: ${result.error}`, result.error);
  }
}

async function testUserRegistration() {
  log('Testing User Registration...');
  
  const users = [
    {
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'testpass123',
      role: 'admin'
    },
    {
      name: 'Test Organization',
      email: 'testorg@test.com',
      password: 'testpass123',
      role: 'org'
    },
    {
      name: 'Test User',
      email: 'testuser@test.com',
      password: 'testpass123',
      role: 'user'
    }
  ];
  
  for (const userData of users) {
    const result = await makeRequest('POST', '/auth/register', userData);
    if (result.success) {
      testData.users[userData.role] = {
        ...userData,
        id: result.data.data.user.id
      };
      testData.tokens[userData.role] = result.data.data.token;
      logResult(`Register ${userData.role}`, 'PASS', `${userData.role} registered successfully`);
    } else {
      logResult(`Register ${userData.role}`, 'FAIL', `Registration failed: ${result.error.message}`);
    }
  }
}

async function testUserLogin() {
  log('Testing User Login...');
  
  const roles = ['admin', 'org', 'user'];
  
  for (const role of roles) {
    if (!testData.users[role]) continue;
    
    const loginData = {
      email: testData.users[role].email,
      password: testData.users[role].password
    };
    
    const result = await makeRequest('POST', '/auth/login', loginData);
    if (result.success) {
      testData.tokens[role] = result.data.data.token;
      logResult(`Login ${role}`, 'PASS', `${role} login successful`);
    } else {
      logResult(`Login ${role}`, 'FAIL', `Login failed: ${result.error.message}`);
    }
  }
}

async function testUserProfile() {
  log('Testing User Profile endpoints...');
  
  for (const role of ['admin', 'org', 'user']) {
    if (!testData.tokens[role]) continue;
    
    // Get profile
    const getResult = await makeRequest('GET', '/auth/profile', null, testData.tokens[role]);
    if (getResult.success) {
      logResult(`Get ${role} Profile`, 'PASS', 'Profile retrieved successfully');
    } else {
      logResult(`Get ${role} Profile`, 'FAIL', `Failed to get profile: ${getResult.error.message}`);
    }
    
    // Update profile
    const updateData = { name: `Updated ${role} Name` };
    const updateResult = await makeRequest('PUT', '/users/profile', updateData, testData.tokens[role]);
    if (updateResult.success) {
      logResult(`Update ${role} Profile`, 'PASS', 'Profile updated successfully');
    } else {
      logResult(`Update ${role} Profile`, 'FAIL', `Failed to update profile: ${updateResult.error.message}`);
    }
  }
}

async function testWalletOperations() {
  log('Testing Wallet Operations...');
  
  for (const role of ['user', 'org']) {
    if (!testData.tokens[role]) continue;
    
    const result = await makeRequest('GET', '/users/wallet', null, testData.tokens[role]);
    if (result.success) {
      logResult(`Get ${role} Wallet`, 'PASS', `Wallet balance: ${result.data.data.balance}`);
    } else {
      logResult(`Get ${role} Wallet`, 'FAIL', `Failed to get wallet: ${result.error.message}`);
    }
  }
}

async function testServiceOperations() {
  log('Testing Service Operations...');
  
  // Create service (org only)
  if (testData.tokens.org) {
    const serviceData = {
      title: 'Test Service',
      description: 'This is a test service for API testing',
      price: 100,
      category: 'technology',
      features: ['Feature 1', 'Feature 2', 'Feature 3']
    };
    
    const createResult = await makeRequest('POST', '/services', serviceData, testData.tokens.org);
    if (createResult.success) {
      testData.services.testService = createResult.data.data;
      logResult('Create Service', 'PASS', 'Service created successfully');
    } else {
      logResult('Create Service', 'FAIL', `Failed to create service: ${createResult.error.message}`);
    }
  }
  
  // Get all services
  const getServicesResult = await makeRequest('GET', '/services');
  if (getServicesResult.success) {
    logResult('Get Services', 'PASS', `Retrieved ${getServicesResult.data.data?.length || 0} services`);
  } else {
    logResult('Get Services', 'FAIL', `Failed to get services: ${getServicesResult.error.message}`);
  }
  
  // Get specific service
  if (testData.services.testService) {
    const getServiceResult = await makeRequest('GET', `/services/${testData.services.testService.id}`);
    if (getServiceResult.success) {
      logResult('Get Service By ID', 'PASS', 'Service retrieved successfully');
    } else {
      logResult('Get Service By ID', 'FAIL', `Failed to get service: ${getServiceResult.error.message}`);
    }
    
    // Update service
    const updateData = { title: 'Updated Test Service' };
    const updateResult = await makeRequest('PUT', `/services/${testData.services.testService.id}`, updateData, testData.tokens.org);
    if (updateResult.success) {
      logResult('Update Service', 'PASS', 'Service updated successfully');
    } else {
      logResult('Update Service', 'FAIL', `Failed to update service: ${updateResult.error.message}`);
    }
    
    // Add review (user only)
    if (testData.tokens.user) {
      const reviewData = {
        rating: 5,
        review: 'Great service! Highly recommended.'
      };
      
      const reviewResult = await makeRequest('POST', `/services/${testData.services.testService.id}/reviews`, reviewData, testData.tokens.user);
      if (reviewResult.success) {
        logResult('Add Service Review', 'PASS', 'Review added successfully');
      } else {
        logResult('Add Service Review', 'FAIL', `Failed to add review: ${reviewResult.error.message}`);
      }
    }
  }
}

async function testPaymentOperations() {
  log('Testing Payment Operations...');
  
  if (!testData.tokens.user) return;
  
  // Create payment order
  const orderData = {
    amount: 100,
    purpose: 'coin_purchase'
  };
  
  const orderResult = await makeRequest('POST', '/payments/orders', orderData, testData.tokens.user);
  if (orderResult.success) {
    testData.payments = { order: orderResult.data.data };
    logResult('Create Payment Order', 'PASS', 'Payment order created successfully');
  } else {
    logResult('Create Payment Order', 'FAIL', `Failed to create payment order: ${orderResult.error.message}`);
  }
  
  // Note: Payment verification requires actual Razorpay response, so we'll test the endpoint structure
  const verifyData = {
    razorpay_order_id: 'test_order_id',
    razorpay_payment_id: 'test_payment_id',
    razorpay_signature: 'test_signature'
  };
  
  const verifyResult = await makeRequest('POST', '/payments/verify', verifyData, testData.tokens.user);
  // This will likely fail due to invalid signature, but tests endpoint availability
  logResult('Payment Verify Endpoint', verifyResult.status === 400 ? 'PASS' : 'FAIL', 
    verifyResult.status === 400 ? 'Endpoint accessible (invalid signature expected)' : 'Endpoint not accessible');
}

async function testTransactionOperations() {
  log('Testing Transaction Operations...');
  
  for (const role of ['user', 'org', 'admin']) {
    if (!testData.tokens[role]) continue;
    
    // Get transactions
    const transactionsResult = await makeRequest('GET', '/transactions', null, testData.tokens[role]);
    if (transactionsResult.success) {
      logResult(`Get ${role} Transactions`, 'PASS', `Retrieved ${transactionsResult.data.data?.length || 0} transactions`);
    } else {
      logResult(`Get ${role} Transactions`, 'FAIL', `Failed to get transactions: ${transactionsResult.error.message}`);
    }
    
    // Get transaction stats
    const statsResult = await makeRequest('GET', '/transactions/stats', null, testData.tokens[role]);
    if (statsResult.success) {
      logResult(`Get ${role} Transaction Stats`, 'PASS', 'Transaction stats retrieved successfully');
    } else {
      logResult(`Get ${role} Transaction Stats`, 'FAIL', `Failed to get stats: ${statsResult.error.message}`);
    }
  }
}

async function testConversionOperations() {
  log('Testing Conversion Operations...');
  
  // Create conversion request (org only)
  if (testData.tokens.org) {
    const conversionData = {
      amount: 100,
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        accountHolderName: 'Test Organization',
        bankName: 'Test Bank'
      }
    };
    
    const createResult = await makeRequest('POST', '/conversions', conversionData, testData.tokens.org);
    if (createResult.success) {
      testData.conversions.testRequest = createResult.data.data;
      logResult('Create Conversion Request', 'PASS', 'Conversion request created successfully');
    } else {
      logResult('Create Conversion Request', 'FAIL', `Failed to create conversion: ${createResult.error.message}`);
    }
    
    // Get conversion requests
    const getResult = await makeRequest('GET', '/conversions', null, testData.tokens.org);
    if (getResult.success) {
      logResult('Get Conversion Requests', 'PASS', `Retrieved ${getResult.data.data?.length || 0} conversion requests`);
    } else {
      logResult('Get Conversion Requests', 'FAIL', `Failed to get conversions: ${getResult.error.message}`);
    }
  }
  
  // Admin operations
  if (testData.tokens.admin && testData.conversions.testRequest) {
    // Approve conversion
    const approveData = { transactionId: 'TEST_TXN_123' };
    const approveResult = await makeRequest('POST', `/conversions/${testData.conversions.testRequest.id}/approve`, approveData, testData.tokens.admin);
    if (approveResult.success) {
      logResult('Approve Conversion', 'PASS', 'Conversion approved successfully');
    } else {
      logResult('Approve Conversion', 'FAIL', `Failed to approve conversion: ${approveResult.error.message}`);
    }
  }
}

async function testAdminOperations() {
  log('Testing Admin Operations...');
  
  if (!testData.tokens.admin) return;
  
  // Get dashboard stats
  const dashboardResult = await makeRequest('GET', '/admin/dashboard', null, testData.tokens.admin);
  if (dashboardResult.success) {
    logResult('Admin Dashboard', 'PASS', 'Dashboard stats retrieved successfully');
  } else {
    logResult('Admin Dashboard', 'FAIL', `Failed to get dashboard: ${dashboardResult.error.message}`);
  }
  
  // Get recent activity
  const activityResult = await makeRequest('GET', '/admin/activity?limit=5', null, testData.tokens.admin);
  if (activityResult.success) {
    logResult('Admin Activity', 'PASS', 'Recent activity retrieved successfully');
  } else {
    logResult('Admin Activity', 'FAIL', `Failed to get activity: ${activityResult.error.message}`);
  }
  
  // Get system health
  const healthResult = await makeRequest('GET', '/admin/health', null, testData.tokens.admin);
  if (healthResult.success) {
    logResult('Admin Health Check', 'PASS', 'System health retrieved successfully');
  } else {
    logResult('Admin Health Check', 'FAIL', `Failed to get health: ${healthResult.error.message}`);
  }
  
  // Approve service
  if (testData.services.testService) {
    const approveResult = await makeRequest('POST', `/admin/services/${testData.services.testService.id}/approve`, {}, testData.tokens.admin);
    if (approveResult.success) {
      logResult('Approve Service', 'PASS', 'Service approved successfully');
    } else {
      logResult('Approve Service', 'FAIL', `Failed to approve service: ${approveResult.error.message}`);
    }
  }
  
  // Get audit logs
  const auditResult = await makeRequest('GET', '/admin/audit-logs?limit=10', null, testData.tokens.admin);
  if (auditResult.success) {
    logResult('Get Audit Logs', 'PASS', 'Audit logs retrieved successfully');
  } else {
    logResult('Get Audit Logs', 'FAIL', `Failed to get audit logs: ${auditResult.error.message}`);
  }
}

async function testAuthenticationSecurity() {
  log('Testing Authentication Security...');
  
  // Test accessing protected endpoint without token
  const noTokenResult = await makeRequest('GET', '/auth/profile');
  if (noTokenResult.status === 401) {
    logResult('No Token Protection', 'PASS', 'Protected endpoint correctly rejects requests without token');
  } else {
    logResult('No Token Protection', 'FAIL', 'Protected endpoint should reject requests without token');
  }
  
  // Test accessing protected endpoint with invalid token
  const invalidTokenResult = await makeRequest('GET', '/auth/profile', null, 'invalid_token');
  if (invalidTokenResult.status === 401) {
    logResult('Invalid Token Protection', 'PASS', 'Protected endpoint correctly rejects invalid tokens');
  } else {
    logResult('Invalid Token Protection', 'FAIL', 'Protected endpoint should reject invalid tokens');
  }
  
  // Test role-based access (user trying to access admin endpoint)
  if (testData.tokens.user) {
    const roleResult = await makeRequest('GET', '/admin/dashboard', null, testData.tokens.user);
    if (roleResult.status === 403) {
      logResult('Role-based Access Control', 'PASS', 'Role-based access control working correctly');
    } else {
      logResult('Role-based Access Control', 'FAIL', 'User should not access admin endpoints');
    }
  }
}

async function cleanupTestData() {
  log('Cleaning up test data...');
  
  // Delete test service
  if (testData.services.testService && testData.tokens.org) {
    const deleteResult = await makeRequest('DELETE', `/services/${testData.services.testService.id}`, null, testData.tokens.org);
    if (deleteResult.success) {
      logResult('Cleanup Service', 'PASS', 'Test service deleted successfully');
    } else {
      logResult('Cleanup Service', 'FAIL', `Failed to delete test service: ${deleteResult.error.message}`);
    }
  }
  
  // Logout users
  for (const role of ['admin', 'org', 'user']) {
    if (testData.tokens[role]) {
      const logoutResult = await makeRequest('POST', '/auth/logout', {}, testData.tokens[role]);
      if (logoutResult.success) {
        logResult(`Logout ${role}`, 'PASS', `${role} logged out successfully`);
      } else {
        logResult(`Logout ${role}`, 'FAIL', `Failed to logout ${role}: ${logoutResult.error.message}`);
      }
    }
  }
}

function generateTestReport() {
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${((testResults.passed / testResults.total) * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    },
    testData: testData,
    details: testResults.details
  };
  
  // Save report to file
  fs.writeFileSync('api-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('🧪 API TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}`);
  console.log(`📄 Detailed report saved to: api-test-report.json`);
  console.log('='.repeat(80));
  
  return report;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting ErthaExchange API Test Suite...\n');
  
  try {
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();
    await testUserProfile();
    await testWalletOperations();
    await testServiceOperations();
    await testPaymentOperations();
    await testTransactionOperations();
    await testConversionOperations();
    await testAdminOperations();
    await testAuthenticationSecurity();
    await cleanupTestData();
    
    return generateTestReport();
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    return null;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(report => {
    if (report) {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = { runAllTests, testData, testResults };