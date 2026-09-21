-- SRI LAKSHMI SAIRAM ENTERPRISES - DTH Distributor & Dealer Management Schema
-- Location: Cherukupalli, Andhra Pradesh, India

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'dealer' CHECK (role IN ('admin', 'staff', 'dealer')),
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100),
    dealer_id UUID,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEALERS TABLE
CREATE TABLE IF NOT EXISTS public.dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    shop_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    alternate_mobile VARCHAR(15),
    email VARCHAR(100),
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    village_or_town VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL DEFAULT '522309',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 20000.00,
    allow_overlimit_requests BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key reference to profiles after dealers table creation
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_dealer 
FOREIGN KEY (dealer_id) REFERENCES public.dealers(id) ON DELETE SET NULL;

-- 3. OPERATORS
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    default_commission_rate NUMERIC(6,2) NOT NULL DEFAULT 4.50,
    support_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('stb', 'smart_card', 'remote', 'adapter', 'dish_lnb', 'cable', 'connector', 'voucher', 'other')),
    operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    mrp NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    dealer_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    min_stock_threshold INTEGER NOT NULL DEFAULT 10,
    is_serialized BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WAREHOUSE STOCK
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    faulty_quantity INTEGER NOT NULL DEFAULT 0 CHECK (faulty_quantity >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEALER STOCK
CREATE TABLE IF NOT EXISTS public.dealer_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    faulty_quantity INTEGER NOT NULL DEFAULT 0 CHECK (faulty_quantity >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dealer_id, product_id)
);

-- 7. SERIAL NUMBERS & VC NUMBERS
CREATE TABLE IF NOT EXISTS public.serial_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    vc_number VARCHAR(100),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    operator_code VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'in_warehouse' CHECK (status IN ('in_warehouse', 'with_dealer', 'installed', 'faulty', 'returned')),
    current_dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(100),
    customer_mobile VARCHAR(15),
    installed_at TIMESTAMPTZ,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('purchase_in', 'dispatch_to_dealer', 'dealer_return', 'faulty_in', 'replacement_out', 'audit_adjustment')),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    dealer_id UUID REFERENCES public.dealers(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    serial_numbers JSONB DEFAULT '[]'::jsonb,
    reference_no VARCHAR(100),
    delivery_receipt_no VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DEALER STOCK REQUESTS
CREATE TABLE IF NOT EXISTS public.dealer_stock_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_no VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dispatched', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DIGITAL KHATA / LEDGER TRANSACTIONS (IMMUTABLE)
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('BALANCE_ADDED', 'PAYMENT_RECEIVED', 'RECHARGE_DEDUCTION', 'REFUND', 'ADJUSTMENT', 'CREDIT', 'DEBIT', 'STOCK_PURCHASE')),
    balance_after NUMERIC(12,2) NOT NULL,
    outstanding_after NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'SYSTEM', 'OTHER')),
    reference_no VARCHAR(100),
    attachment_url TEXT,
    is_reversal BOOLEAN DEFAULT FALSE,
    original_transaction_id UUID REFERENCES public.ledger_transactions(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAYMENTS / MONEY SUBMISSION
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')),
    utr_number VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    screenshot_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ledger_transaction_id UUID REFERENCES public.ledger_transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. COMMISSION RULES
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
    min_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(10,2) NOT NULL DEFAULT 99999.00,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    commission_value NUMERIC(6,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RECHARGE REQUESTS
CREATE TABLE IF NOT EXISTS public.recharge_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_no VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100),
    customer_mobile VARCHAR(15),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    plan_amount NUMERIC(10,2) NOT NULL CHECK (plan_amount > 0),
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10,2) NOT NULL,
    plan_description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
    operator_ref_no VARCHAR(100),
    failure_reason TEXT,
    notes TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TECHNICIANS
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    area VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'busy', 'inactive')),
    completed_tickets_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SERVICE TICKETS
CREATE TABLE IF NOT EXISTS public.service_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_no VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE RESTRICT,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_mobile VARCHAR(15) NOT NULL,
    customer_address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    issue_type VARCHAR(30) NOT NULL CHECK (issue_type IN ('installation', 'stb_fault', 'remote_issue', 'channel_issue', 'shifting', 'replacement', 'customer_complaint', 'other')),
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed')),
    assigned_technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('all', 'admin', 'dealer')),
    target_dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('payment', 'recharge', 'stock', 'ticket', 'credit_warning', 'system')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. AUDIT LOGS (IMMUTABLE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    business_name VARCHAR(150) NOT NULL DEFAULT 'SRI LAKSHMI SAIRAM ENTERPRISES',
    tagline VARCHAR(150) DEFAULT 'Authorized DTH Distributor & Multi-Brand Service Provider',
    proprietor VARCHAR(100) DEFAULT 'Owner',
    address TEXT NOT NULL DEFAULT 'Main Road, Cherukupalli, Guntur Dist',
    location VARCHAR(100) NOT NULL DEFAULT 'Cherukupalli',
    district VARCHAR(100) NOT NULL DEFAULT 'Bapatla / Guntur',
    state VARCHAR(50) NOT NULL DEFAULT 'Andhra Pradesh',
    pincode VARCHAR(10) NOT NULL DEFAULT '522309',
    primary_mobile VARCHAR(15) NOT NULL DEFAULT '9848012345',
    support_mobile VARCHAR(15) DEFAULT '9848012346',
    email VARCHAR(100) DEFAULT 'sairamenterprises.cherukupalli@gmail.com',
    gst_number VARCHAR(30) DEFAULT '37AAAAA0000A1Z5',
    upi_id VARCHAR(100) DEFAULT 'sairam.dth@upi',
    bank_name VARCHAR(100) DEFAULT 'State Bank of India',
    account_number VARCHAR(50) DEFAULT '38947291048',
    ifsc_code VARCHAR(20) DEFAULT 'SBIN0001234',
    branch VARCHAR(100) DEFAULT 'Cherukupalli Branch',
    default_credit_limit NUMERIC(12,2) DEFAULT 20000.00,
    lock_requests_on_limit_cross BOOLEAN DEFAULT FALSE,
    low_stock_warning_level INTEGER DEFAULT 15,
    eod_whatsapp_number VARCHAR(15) DEFAULT '919848012345',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_dealers_code ON public.dealers(dealer_code);
CREATE INDEX IF NOT EXISTS idx_dealers_mobile ON public.dealers(mobile);
CREATE INDEX IF NOT EXISTS idx_dealers_area ON public.dealers(area);

CREATE INDEX IF NOT EXISTS idx_ledger_dealer_id ON public.ledger_transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_transactions(type);

CREATE INDEX IF NOT EXISTS idx_serials_number ON public.serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serials_vc ON public.serial_numbers(vc_number);
CREATE INDEX IF NOT EXISTS idx_serials_dealer ON public.serial_numbers(current_dealer_id);
CREATE INDEX IF NOT EXISTS idx_serials_customer ON public.serial_numbers(customer_id);

CREATE INDEX IF NOT EXISTS idx_recharge_dealer ON public.recharge_requests(dealer_id);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON public.recharge_requests(status);
CREATE INDEX IF NOT EXISTS idx_recharge_customer ON public.recharge_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_tickets_dealer ON public.service_tickets(dealer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_tech ON public.service_tickets(assigned_technician_id);

CREATE INDEX IF NOT EXISTS idx_payments_dealer ON public.payments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin/staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get dealer_id of current user
CREATE OR REPLACE FUNCTION public.get_auth_dealer_id()
RETURNS UUID AS $$
DECLARE
    d_id UUID;
BEGIN
    SELECT dealer_id INTO d_id FROM public.profiles WHERE id = auth.uid();
    RETURN d_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DEALERS POLICIES
CREATE POLICY "Admins full access to dealers" ON public.dealers
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view only their own record" ON public.dealers
    FOR SELECT USING (id = public.get_auth_dealer_id());

-- LEDGER TRANSACTIONS POLICIES (STRICT ISOLATION)
CREATE POLICY "Admins full access to ledger" ON public.ledger_transactions
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view only their own ledger transactions" ON public.ledger_transactions
    FOR SELECT USING (dealer_id = public.get_auth_dealer_id());

-- DEALER STOCK POLICIES
CREATE POLICY "Admins full access to dealer stock" ON public.dealer_stock
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view only their own stock" ON public.dealer_stock
    FOR SELECT USING (dealer_id = public.get_auth_dealer_id());

-- RECHARGE REQUESTS POLICIES
CREATE POLICY "Admins full access to recharge requests" ON public.recharge_requests
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view and insert their own recharge requests" ON public.recharge_requests
    FOR SELECT USING (dealer_id = public.get_auth_dealer_id());

CREATE POLICY "Dealers insert recharge requests" ON public.recharge_requests
    FOR INSERT WITH CHECK (dealer_id = public.get_auth_dealer_id());

-- PAYMENTS POLICIES
CREATE POLICY "Admins full access to payments" ON public.payments
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view their own payments" ON public.payments
    FOR SELECT USING (dealer_id = public.get_auth_dealer_id());

CREATE POLICY "Dealers submit payments" ON public.payments
    FOR INSERT WITH CHECK (dealer_id = public.get_auth_dealer_id());

-- SERVICE TICKETS POLICIES
CREATE POLICY "Admins full access to service tickets" ON public.service_tickets
    FOR ALL USING (public.is_admin_or_staff());

CREATE POLICY "Dealers view their own service tickets" ON public.service_tickets
    FOR SELECT USING (dealer_id = public.get_auth_dealer_id());

CREATE POLICY "Dealers create service tickets" ON public.service_tickets
    FOR INSERT WITH CHECK (dealer_id = public.get_auth_dealer_id());
