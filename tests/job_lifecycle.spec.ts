import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

test.describe.configure({ mode: 'serial' });

test.describe('Job Lifecycle (E2E)', () => {
  let companyOwnerId: string;
  let companyId: string;
  let technicianId: string;
  let customerId: string;
  let jobId: string;
  let offerId: string;

  // Cleanup
  const cleanup = async () => {
    // Delete in reverse order of dependencies
    if (jobId) await supabaseAdmin.from('jobs').delete().eq('id', jobId);
    if (technicianId) await supabaseAdmin.auth.admin.deleteUser(technicianId);
    if (companyOwnerId) await supabaseAdmin.auth.admin.deleteUser(companyOwnerId);
    if (customerId) await supabaseAdmin.auth.admin.deleteUser(customerId);
  };

  test.beforeAll(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
  });

  test('1. Register Company Owner & Company', async () => {
    // 1. Create Auth User
    const email = `owner_${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    });
    expect(authError).toBeNull();
    companyOwnerId = authData.user!.id;

    // 2. Register Company (Creates Profile + Company)
    const { error: rpcError } = await supabaseAdmin.rpc('register_company', {
      p_user_id: companyOwnerId,
      p_owner_name: 'Test Owner',
      p_company_name: `Test Co ${Date.now()}`,
      p_phone: `+96650${Math.floor(1000000 + Math.random() * 9000000)}`,
      p_commercial_register: '1234567890'
    });
    expect(rpcError).toBeNull();

    // 3. Get Company ID
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', companyOwnerId)
      .single();
    companyId = company!.id;
    expect(companyId).toBeDefined();

    // 4. ACTIVATE COMPANY (Required for technician registration)
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ status: 'active' })
      .eq('id', companyId);
    expect(updateError).toBeNull();
  });

  test('2. Register Technician', async () => {
    // 1. Create Auth User
    const email = `tech_${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    });
    expect(authError).toBeNull();
    technicianId = authData.user!.id;

    // 2. Register Technician (Creates Profile + Technician)
    const { error: rpcError } = await supabaseAdmin.rpc('register_technician', {
      p_user_id: technicianId,
      p_full_name: 'Test Tech',
      p_phone: `+96651${Math.floor(1000000 + Math.random() * 9000000)}`,
      p_company_id: companyId,
      p_specialization: 'Plumbing'
    });
    expect(rpcError).toBeNull();

    // 3. Activate Technician
    const { data: techData } = await supabaseAdmin
      .from('technicians')
      .select('id')
      .eq('user_id', technicianId)
      .single();
      
    const { error: activateError } = await supabaseAdmin.rpc('activate_technician', {
      p_user_id: companyOwnerId,
      p_technician_id: techData!.id
    });
    expect(activateError).toBeNull();

    // 4. Assign Skill (Required for submitting offers)
    const { error: skillError } = await supabaseAdmin
      .from('technician_skills')
      .insert({
        technician_id: techData!.id,
        category_id: 1
      });
    expect(skillError).toBeNull();
  });

  test('3. Customer Creates Job', async () => {
    // 1. Create Auth User
    const email = `cust_${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    });
    expect(authError).toBeNull();
    customerId = authData.user!.id;

    // 2. Register Customer (Creates Profile + Customer)
    await supabaseAdmin.rpc('register_customer', {
      p_user_id: customerId,
      p_full_name: 'Test Customer',
      p_phone: `+96652${Math.floor(1000000 + Math.random() * 9000000)}`
    });

    // 3. Create Address (Required for job)
    const { data: custData } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('user_id', customerId)
      .single();
    
    const { data: address } = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        customer_id: custData!.id,
        label: 'Home',
        address_line1: 'Test Street',
        location: 'POINT(46.6753 24.7136)', // Riyadh
        city: 'Riyadh'
      })
      .select()
      .single();

    // 4. Create Job
    const { data: jobData, error: jobError } = await supabaseAdmin.rpc('create_job', {
      p_user_id: customerId,
      p_address_id: address!.id,
      p_category_id: 1,
      p_title: 'Fix Leak',
      p_description: 'Urgent leak in bathroom',
      p_auto_publish: true
    });
    expect(jobError).toBeNull();
    
    // Get Job ID
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('customer_id', custData!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    jobId = job!.id;
    expect(jobId).toBeDefined();
  });

  test('4. Technician Submits Offer', async () => {
    // Update technician location to be online and available
    await supabaseAdmin.rpc('update_technician_location', {
      p_user_id: technicianId,
      p_latitude: 24.7136,
      p_longitude: 46.6753,
      p_is_online: true,
      p_is_available: true
    });

    const { error } = await supabaseAdmin.rpc('submit_offer', {
      p_user_id: technicianId,
      p_job_id: jobId,
      p_amount: 150.00,
      p_message: 'I can arrive in 30 mins',
      p_estimated_duration_minutes: 60
    });
    expect(error).toBeNull();

    const { data: offer } = await supabaseAdmin
      .from('price_offers')
      .select('id')
      .eq('job_id', jobId)
      .single();
    offerId = offer!.id;
    expect(offerId).toBeDefined();
  });

  test('5. Customer Accepts Offer', async () => {
    const { data, error } = await supabaseAdmin.rpc('accept_offer', {
      p_user_id: customerId,
      p_offer_id: offerId
    });
    
    expect(error).toBeNull();
    expect(data).toHaveProperty('payment_url');
    expect(data).toHaveProperty('token');
    console.log('Payment Link Generated:', data.payment_url);
  });
});
