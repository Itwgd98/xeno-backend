#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Tests all critical endpoints and reports status
 * 
 * Usage: node healthcheck.js [URL]
 * Example: node healthcheck.js https://xeno-backend-84lr.onrender.com
 */

import axios from 'axios';

const BASE_URL = process.argv[2] || 'http://localhost:5000';
let testResults = [];

async function test(name, testFn) {
  try {
    await testFn();
    testResults.push({ name, status: '✅', message: 'PASS' });
    console.log(`✅ ${name}`);
  } catch (err) {
    testResults.push({ name, status: '❌', message: err.message });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

async function runTests() {
  console.log(`\n🔍 Testing Deployment: ${BASE_URL}\n`);

  // Test 1: Server is up
  await test('Server is responding', async () => {
    const res = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Test 2: Frontend loads
  await test('Frontend HTML loads', async () => {
    const res = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
    if (!res.data.includes('Xeno')) throw new Error('Frontend not loaded');
  });

  // Test 3: Login endpoint exists
  await test('Login endpoint responds', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, 
        { email: 'test@example.com', tenantId: '999' },
        { timeout: 5000 }
      );
    } catch (err) {
      if (err.response?.status === 401) return; // 401 is OK (tenant not found)
      throw err;
    }
  });

  // Test 4: Metrics endpoint with tenant header
  await test('Metrics endpoint responds', async () => {
    try {
      await axios.get(`${BASE_URL}/metrics`, 
        { headers: { 'x-tenant-id': '1' }, timeout: 5000 }
      );
    } catch (err) {
      if (err.response?.status === 401) return; // 401 is OK
      throw err;
    }
  });

  // Test 5: Orders endpoint
  await test('Orders endpoint responds', async () => {
    try {
      await axios.get(`${BASE_URL}/orders`, 
        { 
          headers: { 'Authorization': 'Bearer invalid-token' },
          timeout: 5000 
        }
      );
    } catch (err) {
      if (err.response?.status === 401) return; // 401 is expected
      throw err;
    }
  });

  // Test 6: Sync endpoint
  await test('Sync endpoint responds', async () => {
    try {
      await axios.post(`${BASE_URL}/sync/now`, {}, 
        { 
          headers: { 'Authorization': 'Bearer invalid-token' },
          timeout: 5000 
        }
      );
    } catch (err) {
      if (err.response?.status === 401) return; // 401 is expected
      throw err;
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  const passed = testResults.filter(r => r.status === '✅').length;
  const total = testResults.length;
  
  if (passed === total) {
    console.log(`\n✅ ALL TESTS PASSED (${passed}/${total})\n`);
    console.log('🚀 Deployment is healthy!\n');
  } else {
    console.log(`\n⚠️  SOME TESTS FAILED (${passed}/${total})\n`);
    console.log('Failed tests:');
    testResults
      .filter(r => r.status === '❌')
      .forEach(r => console.log(`  • ${r.name}: ${r.message}`));
    console.log('');
  }
}

runTests().catch(err => {
  console.error('\n❌ Health check error:', err.message);
  process.exit(1);
});
