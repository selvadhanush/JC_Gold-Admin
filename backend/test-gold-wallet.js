const BASE_URL = 'http://localhost:5000/api/v1';

async function test() {
    console.log('🧪 Starting End-to-End Backend Testing for Digital Gold Wallet...');

    let adminToken, buyerToken, financeToken, orderToken;

    // 1. LOGIN TESTS
    console.log('\n🔐 Testing Authentication...');
    
    // Login Super Admin
    const superAdminRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'adminEmail@gmail.com', password: 'superadmin123' })
    });
    const superAdminData = await superAdminRes.json();
    adminToken = superAdminData.token;
    console.log('✅ Super Admin Logged In');

    // Login Buyer
    const buyerRes = await fetch(`${BASE_URL}/buyer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'goldbuyer@test.com', password: 'password123' })
    });
    const buyerData = await buyerRes.json();
    if (!buyerData.data) {
        console.error('❌ Buyer Login Failed:', buyerData);
        throw new Error('Buyer login failed');
    }
    buyerToken = buyerData.data.token;
    console.log('✅ Buyer Logged In');

    // Login Finance Admin
    const financeRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'finance@test.com', password: 'password123' })
    });
    const financeData = await financeRes.json();
    financeToken = financeData.token;
    console.log('✅ Finance Admin Logged In');

    // Login Order Admin
    const orderRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'order@test.com', password: 'password123' })
    });
    const orderData = await orderRes.json();
    orderToken = orderData.token;
    console.log('✅ Order Admin Logged In');

    // 2. GOLD RATE TESTS
    console.log('\n📈 Testing Gold Rate Management...');
    const rateRes = await fetch(`${BASE_URL}/admin/digital-gold/gold-rate`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ 
            date: new Date().toISOString(),
            metalType: 'GOLD',
            ratePerGram: 6500,
            source: 'MANUAL'
        })
    });
    const rateData = await rateRes.json();
    if (!rateData.data) {
        console.error('❌ Set Gold Rate Failed:', JSON.stringify(rateData, null, 2));
        throw new Error('Set gold rate failed');
    }
    console.log('✅ Gold Rate Set:', rateData.data.ratePerGram);

    // 3. BUY GOLD TESTS
    console.log('\n💰 Testing Gold Purchase...');
    const buyRes = await fetch(`${BASE_URL}/buyer/digital-gold/buy`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${buyerToken}`
        },
        body: JSON.stringify({ 
            amount: 13000, // Should be 2 grams at 6500/g
            paymentMethod: 'ONLINE'
        })
    });
    const buyData = await buyRes.json();
    if (!buyData.data) {
        console.error('❌ Gold Purchase Failed:', JSON.stringify(buyData, null, 2));
        throw new Error('Gold purchase failed');
    }
    const transactionId = buyData.data._id;
    console.log('✅ Gold Purchase Request Created (Pending):', buyData.data.goldGrams, 'grams');

    // 4. ROLE AUTHORIZATION TESTS
    console.log('\n❌ Testing Role Violations...');
    const invalidApproveRes = await fetch(`${BASE_URL}/admin/digital-gold/approve/${transactionId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orderToken}` // Order admin should not be able to approve purchases
        },
        body: JSON.stringify({ status: 'APPROVED' })
    });
    console.log('✅ Order Admin Blocked from Purchase Approval:', invalidApproveRes.status === 403 ? 'OK' : 'FAILED');

    // 5. FINANCE APPROVAL TESTS
    console.log('\n🏦 Testing Finance Approval...');
    const approveRes = await fetch(`${BASE_URL}/admin/digital-gold/approve/${transactionId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${financeToken}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
    });
    const approveData = await approveRes.json();
    console.log('✅ Purchase Approved by Finance Admin');

    // Verify Wallet
    const walletRes = await fetch(`${BASE_URL}/buyer/digital-gold/wallet`, {
        headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const walletData = await walletRes.json();
    console.log('✅ Wallet Balance Updated:', walletData.data.wallet.goldBalance, 'grams');

    // 6. REDEMPTION TESTS
    console.log('\n🔄 Testing Redemption (Cash)...');
    const redeemRes = await fetch(`${BASE_URL}/buyer/digital-gold/redeem`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${buyerToken}`
        },
        body: JSON.stringify({ 
            redeemType: 'CASH',
            goldGrams: 1
        })
    });
    const redeemData = await redeemRes.json();
    const redemptionId = redeemData.data._id;
    console.log('✅ Cash Redemption Requested:', redeemData.data.goldGrams, 'grams');

    // Verify balance locked
    const walletLockedRes = await fetch(`${BASE_URL}/buyer/digital-gold/wallet`, {
        headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const walletLockedData = await walletLockedRes.json();
    console.log('✅ Wallet Balance Locked (Deducted on Request):', walletLockedData.data.wallet.goldBalance, 'grams');

    // Approve Redemption
    const approveRedeemRes = await fetch(`${BASE_URL}/admin/digital-gold/redemption/approve/${redemptionId}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${financeToken}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
    });
    console.log('✅ Cash Redemption Approved by Finance');

    // 7. EDGE CASE: REJECTION RESTORE
    console.log('\n🔄 Testing Redemption Rejection (Gold Restoration)...');
    const redeemReq2 = await fetch(`${BASE_URL}/buyer/digital-gold/redeem`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${buyerToken}`
        },
        body: JSON.stringify({ 
            redeemType: 'GOLD',
            goldGrams: 1,
            deliveryAddress: {
                street: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                phoneNumber: '1234567890'
            }
        })
    });
    const redeemData2 = await redeemReq2.json();
    
    const rejectRedeemRes = await fetch(`${BASE_URL}/admin/digital-gold/redemption/approve/${redeemData2.data._id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orderToken}`
        },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Test Rejection' })
    });
    console.log('✅ Gold Redemption Rejected by Order Admin');

    const walletFinalRes = await fetch(`${BASE_URL}/buyer/digital-gold/wallet`, {
        headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const walletFinalData = await walletFinalRes.json();
    console.log('✅ Wallet Balance Restored after Rejection:', walletFinalData.data.wallet.goldBalance, 'grams');

    console.log('\n🏁 End-to-End Testing Completed Successfully!');
}

test().catch(err => {
    console.error('💥 Test Failed:', err);
    process.exit(1);
});
