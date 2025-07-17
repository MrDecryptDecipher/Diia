import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import axios from 'axios';

const ApiTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://3.111.22.56:10002';

  const testEndpoint = async (endpoint, name) => {
    try {
      console.log(`🔧 Testing ${name} at ${API_URL}${endpoint}`);
      const response = await axios.get(`${API_URL}${endpoint}`);
      console.log(`✅ ${name} success:`, response.data);
      return {
        name,
        endpoint,
        status: 'success',
        data: response.data,
        error: null
      };
    } catch (error) {
      console.error(`❌ ${name} error:`, error);
      return {
        name,
        endpoint,
        status: 'error',
        data: null,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const tests = [
      { endpoint: '/api/trading/status', name: 'Trading Status' },
      { endpoint: '/api/trades/active', name: 'Active Trades' },
      { endpoint: '/api/metrics', name: 'Metrics' },
      { endpoint: '/api/agents', name: 'Agents' },
      { endpoint: '/api/system/status', name: 'System Status' }
    ];

    const results = [];
    for (const test of tests) {
      const result = await testEndpoint(test.endpoint, test.name);
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsLoading(false);
  };

  // Auto-run tests on component mount
  useEffect(() => {
    console.log('🔧 ApiTest component mounted, running tests...');
    runTests();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        🔧 API Connection Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTests} 
        disabled={isLoading}
        sx={{ mb: 3 }}
      >
        {isLoading ? 'Testing...' : 'Run Tests'}
      </Button>

      {testResults.map((result, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ 
              color: result.status === 'success' ? 'success.main' : 'error.main',
              mb: 1 
            }}>
              {result.status === 'success' ? '✅' : '❌'} {result.name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Endpoint: {result.endpoint}
            </Typography>
            {result.status === 'success' ? (
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                Data received: {JSON.stringify(result.data).substring(0, 200)}...
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                Error: {result.error}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ApiTest;
