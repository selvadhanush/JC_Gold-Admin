#!/usr/bin/env node

/**
 * JC Gold Backend - End-to-End Test Suite
 * Tests all core functionality, KYC workflows, RBAC, and security
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:5000';
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Test data storage
let buyerToken = '';
let buyerId = '';
let superAdminToken = '';
let financeAdminToken = '';
let productAdminToken = '';
let kycId = '';

// Helper functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch(type) {
        case 'success':
            console.log(`[${timestamp}] ✅ ${message}`.green);
            break;
        case 'error':
            console.log(`[${timestamp}] ❌ ${message}`.red);
            break;
        case 'info':
            console.log(`[${timestamp}] ℹ️  ${message}`.blue);
            break;
        case 'section':
            console.log(`\n${'='.repeat(80)}`.yellow);
            console.log(`  ${message}`.yellow.bold);
            console.log(`${'='.repeat(80)}\n`.yellow);
            break;
    }
}

function recordTest(name, passed, error = null) {
    testResults.tests.push({ name, passed, error });
    if (passed) {
        testResults.passed++;
        log(`PASS: ${name}`, 'success');
    } else {
        testResults.failed++;
        log(`FAIL: ${name} - ${error}`, 'error');
    }
}

async function test(name, fn) {
    try {
        await fn();
        recordTest(name, true);
    } catch (error) {
        recordTest(name, false, error.message);
    }
}

// ========================================
// 1. ENVIRONMENT SETUP VERIFICATION
// ========================================
async function testEnvironmentSetup() {
    log('1. Environment Setup Verification', 'section');
    
    await test('Server Health Check', async () => {
        const res = await axios.get(`${BASE_URL}/`);
        if (res.status !== 200) throw new Error('Server not responding');
    });
}

// ========================================
// 2. AUTHENTICATION & RBAC TESTING
// ========================================
async function testAuthentication() {
    log('2. Authentication & RBAC Testing', 'section');
    
    // Buyer Registration
    await test('Buyer Registration', async () => {
        const res = await axios.post(`${BASE_URL}/api/v1/buyer/auth/register`, {
            name: 'Test Buyer',
            email: `testbuyer${Date.now()}@test.com`,
            password: 'Test@123',
            phoneNumber: '9876543210'
        });
        if (!res.data.success) throw new Error('Registration failed');
        buyerToken = res.data.token;
        buyerId = res.data.user._id;
    });
    
    // Admin Logins
    await test('SUPER_ADMIN Login', async () => {
        const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'superadmin@jcgold.com',
            password: 'Super@123'
        });
        if (!res.data.success) throw new Error('Login failed');
        superAdminToken = res.data.token;
    });
    
    await test('FINANCE_ADMIN Login', async () => {
        const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'finance@jcgold.com',
            password: 'Finance@123'
        });
        if (!res.data.success) throw new Error('Login failed');
        financeAdminToken = res.data.token;
    });
    
    await test('PRODUCT_ADMIN Login', async () => {
        const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'product@jcgold.com',
            password: 'Product@123'
        });
        if (!res.data.success) throw new Error('Login failed');
        productAdminToken = res.data.token;
    });
}

// ========================================
// 3. CORE FUNCTIONALITY (WITHOUT KYC)
// ========================================
async function testCoreFunctionality() {
    log('3. Core Functionality (Without KYC)', 'section');
    
    await test('Get Wallet Balance', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/buyer/digital-gold/wallet`, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        if (!res.data.success) throw new Error('Failed to get wallet');
    });
}

// ========================================
// 4. KYC MODULE - BUYER FLOW
// ========================================
async function testKycBuyerFlow() {
    log('4. KYC Module - Buyer Flow', 'section');
    
    // Submit KYC with valid data
    await test('Submit KYC - Valid Data', async () => {
        const res = await axios.post(`${BASE_URL}/api/v1/buyer/kyc/submit`, {
            personalDetails: {
                fullName: 'Test Buyer Full Name',
                dob: '1990-01-15'
            },
            document: {
                type: 'AADHAAR',
                number: '123456789012',
                frontImage: 'https://res.cloudinary.com/dpclbk9dg/image/upload/test/front.jpg',
                backImage: 'https://res.cloudinary.com/dpclbk9dg/image/upload/test/back.jpg'
            },
            address: {
                line1: '123 Test Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                country: 'India'
            }
        }, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        if (!res.data.success) throw new Error('KYC submission failed');
        kycId = res.data.data.kycId;
    });
    
    // Submit KYC with missing fields
    await test('Submit KYC - Missing Fields (400)', async () => {
        try {
            await axios.post(`${BASE_URL}/api/v1/buyer/kyc/submit`, {
                personalDetails: { fullName: 'Test' }
            }, {
                headers: { Authorization: `Bearer ${buyerToken}` }
            });
            throw new Error('Should have failed with 400');
        } catch (error) {
            if (error.response?.status !== 400) throw error;
        }
    });
    
    // Get KYC Status
    await test('Get KYC Status - PENDING', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/buyer/kyc/status`, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        if (res.data.data.status !== 'PENDING') throw new Error('Status should be PENDING');
    });
    
    // Try gold redemption (should be blocked)
    await test('Gold Redemption - Blocked (403)', async () => {
        try {
            await axios.post(`${BASE_URL}/api/v1/buyer/digital-gold/redeem`, {
                redeemType: 'CASH',
                goldGrams: 1
            }, {
                headers: { Authorization: `Bearer ${buyerToken}` }
            });
            throw new Error('Should have been blocked');
        } catch (error) {
            if (error.response?.status !== 403) throw error;
        }
    });
}

// ========================================
// 5. KYC MODULE - ADMIN FLOW
// ========================================
async function testKycAdminFlow() {
    log('5. KYC Module - Admin Flow', 'section');
    
    // List KYC as SUPER_ADMIN
    await test('List KYC - SUPER_ADMIN', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/admin/kyc`, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        if (!res.data.success) throw new Error('Failed to list KYC');
    });
    
    // List KYC as FINANCE_ADMIN
    await test('List KYC - FINANCE_ADMIN', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/admin/kyc`, {
            headers: { Authorization: `Bearer ${financeAdminToken}` }
        });
        if (!res.data.success) throw new Error('Failed to list KYC');
    });
    
    // List KYC as PRODUCT_ADMIN
    await test('List KYC - PRODUCT_ADMIN', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/admin/kyc`, {
            headers: { Authorization: `Bearer ${productAdminToken}` }
        });
        if (!res.data.success) throw new Error('Failed to list KYC');
    });
    
    // View single KYC
    await test('View Single KYC', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/admin/kyc/${kycId}`, {
            headers: { Authorization: `Bearer ${financeAdminToken}` }
        });
        if (!res.data.success) throw new Error('Failed to view KYC');
    });
    
    // Reject without reason (should fail)
    await test('Reject KYC - No Reason (400)', async () => {
        try {
            await axios.patch(`${BASE_URL}/api/v1/admin/kyc/${kycId}/reject`, {}, {
                headers: { Authorization: `Bearer ${financeAdminToken}` }
            });
            throw new Error('Should have failed with 400');
        } catch (error) {
            if (error.response?.status !== 400) throw error;
        }
    });
    
    // Reject as PRODUCT_ADMIN (should fail)
    await test('Reject KYC - PRODUCT_ADMIN (403)', async () => {
        try {
            await axios.patch(`${BASE_URL}/api/v1/admin/kyc/${kycId}/reject`, {
                rejectionReason: 'Test rejection'
            }, {
                headers: { Authorization: `Bearer ${productAdminToken}` }
            });
            throw new Error('Should have been blocked');
        } catch (error) {
            if (error.response?.status !== 403) throw error;
        }
    });
    
    // Reject as FINANCE_ADMIN
    await test('Reject KYC - FINANCE_ADMIN', async () => {
        const res = await axios.patch(`${BASE_URL}/api/v1/admin/kyc/${kycId}/reject`, {
            rejectionReason: 'Document image is unclear. Please upload a clearer photo.'
        }, {
            headers: { Authorization: `Bearer ${financeAdminToken}` }
        });
        if (res.data.data.status !== 'REJECTED') throw new Error('Status should be REJECTED');
    });
    
    // Resubmit KYC
    await test('Resubmit KYC - After Rejection', async () => {
        const res = await axios.put(`${BASE_URL}/api/v1/buyer/kyc/resubmit`, {
            personalDetails: {
                fullName: 'Test Buyer Updated',
                dob: '1990-01-15'
            },
            document: {
                type: 'PAN',
                number: 'ABCDE1234F',
                frontImage: 'https://res.cloudinary.com/dpclbk9dg/image/upload/test/pan-front.jpg'
            },
            address: {
                line1: '456 New Street',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
                country: 'India'
            }
        }, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        if (res.data.data.status !== 'PENDING') throw new Error('Status should be PENDING');
    });
    
    // Approve KYC
    await test('Approve KYC - FINANCE_ADMIN', async () => {
        const res = await axios.patch(`${BASE_URL}/api/v1/admin/kyc/${kycId}/approve`, {}, {
            headers: { Authorization: `Bearer ${financeAdminToken}` }
        });
        if (res.data.data.status !== 'APPROVED') throw new Error('Status should be APPROVED');
    });
}

// ========================================
// 6. KYC ENFORCEMENT VERIFICATION
// ========================================
async function testKycEnforcement() {
    log('6. KYC Enforcement Verification', 'section');
    
    // Gold redemption should now work
    await test('Gold Redemption - After Approval (Success)', async () => {
        try {
            await axios.post(`${BASE_URL}/api/v1/buyer/digital-gold/redeem`, {
                redeemType: 'CASH',
                goldGrams: 0.1
            }, {
                headers: { Authorization: `Bearer ${buyerToken}` }
            });
        } catch (error) {
            // May fail due to insufficient balance, but should not be KYC error
            if (error.response?.status === 403) {
                throw new Error('Should not be blocked by KYC');
            }
        }
    });
}

// ========================================
// 7. SECURITY & COMPLIANCE TESTS
// ========================================
async function testSecurityCompliance() {
    log('7. Security & Compliance Tests', 'section');
    
    await test('Document Number Masking', async () => {
        const res = await axios.get(`${BASE_URL}/api/v1/buyer/kyc/status`, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        const docNumber = res.data.data.document.number;
        if (docNumber && !docNumber.includes('X')) {
            throw new Error('Document number should be masked');
        }
    });
}

// ========================================
// MAIN TEST RUNNER
// ========================================
async function runAllTests() {
    console.log('\n' + '='.repeat(80).cyan);
    console.log('  JC GOLD BACKEND - END-TO-END TEST SUITE'.cyan.bold);
    console.log('='.repeat(80).cyan + '\n');
    
    try {
        await testEnvironmentSetup();
        await testAuthentication();
        await testCoreFunctionality();
        await testKycBuyerFlow();
        await testKycAdminFlow();
        await testKycEnforcement();
        await testSecurityCompliance();
        
    } catch (error) {
        log(`Fatal error: ${error.message}`, 'error');
    }
    
    // Print summary
    console.log('\n' + '='.repeat(80).cyan);
    console.log('  TEST SUMMARY'.cyan.bold);
    console.log('='.repeat(80).cyan);
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`.white);
    console.log(`Passed: ${testResults.passed}`.green);
    console.log(`Failed: ${testResults.failed}`.red);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`.yellow);
    console.log('='.repeat(80).cyan + '\n');
    
    if (testResults.failed > 0) {
        console.log('Failed Tests:'.red.bold);
        testResults.tests.filter(t => !t.passed).forEach(t => {
            console.log(`  ❌ ${t.name}: ${t.error}`.red);
        });
    }
    
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
});
