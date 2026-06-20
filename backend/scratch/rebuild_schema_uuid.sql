BEGIN;

-- Drop all existing tables (cascade to drop foreign keys automatically)
DROP TABLE IF EXISTS public.automation_rules CASCADE;
DROP TABLE IF EXISTS public.expense_groups CASCADE;
DROP TABLE IF EXISTS public.expense_splits CASCADE;
DROP TABLE IF EXISTS public.group_expenses CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.loan_contracts CASCADE;
DROP TABLE IF EXISTS public.loan_installments CASCADE;
DROP TABLE IF EXISTS public.payments_history CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.settlements CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- Enable pgcrypto for UUID generation if needed (usually gen_random_uuid is built-in for modern PG)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.automation_rules
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    wallet_id uuid,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    amount numeric(15, 2) NOT NULL,
    category character varying(50) COLLATE pg_catalog."default",
    frequency character varying(20) COLLATE pg_catalog."default",
    next_run_date date NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Active'::character varying,
    type character varying(20) COLLATE pg_catalog."default" DEFAULT 'Expense'::character varying,
    CONSTRAINT automation_rules_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.expense_groups
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_groups_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.expense_splits
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_id uuid,
    user_id uuid,
    amount_owed numeric(15, 2) NOT NULL,
    CONSTRAINT expense_splits_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.group_expenses
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    paid_by uuid,
    amount numeric(15, 2) NOT NULL,
    description character varying(255) COLLATE pg_catalog."default" NOT NULL,
    expense_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_expenses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.group_members
(
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.loan_contracts
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    party_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    party_phone character varying(20) COLLATE pg_catalog."default",
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    total_principal numeric(15, 2) NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Active'::character varying,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    interest_rate numeric(5, 2) DEFAULT 0,
    total_amount numeric(15, 2) DEFAULT 0,
    CONSTRAINT loan_contracts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.loan_installments
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    contract_id uuid,
    due_date date NOT NULL,
    emi_amount numeric(15, 2) NOT NULL,
    paid_amount numeric(15, 2) DEFAULT 0,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Pending'::character varying,
    payment_date timestamp without time zone,
    CONSTRAINT loan_installments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payments_history
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    amount numeric(15, 2) NOT NULL,
    currency character varying(10) COLLATE pg_catalog."default" DEFAULT 'INR'::character varying,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'success'::character varying,
    provider_payment_id character varying(255) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_history_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.plans
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    price_monthly numeric(10, 2) DEFAULT 0,
    price_yearly numeric(10, 2) DEFAULT 0,
    max_wallets integer DEFAULT 2,
    max_rules integer DEFAULT 2,
    can_auto_emi boolean DEFAULT false,
    can_export_pdf boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plans_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.settlements
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    paid_by uuid,
    paid_to uuid,
    amount numeric(15, 2) NOT NULL,
    settled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT settlements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_messages
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid,
    sender_type character varying(20) COLLATE pg_catalog."default" DEFAULT 'user'::character varying,
    message text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    subject character varying(200) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'Open'::character varying,
    priority character varying(20) COLLATE pg_catalog."default" DEFAULT 'Normal'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_to uuid,
    CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.transactions
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    wallet_id uuid,
    amount numeric(15, 2) NOT NULL,
    type character varying(20) COLLATE pg_catalog."default" NOT NULL,
    category character varying(50) COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    receipt_url text COLLATE pg_catalog."default",
    is_automated boolean DEFAULT false,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    plan_id uuid,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'active'::character varying,
    current_period_end timestamp without time zone,
    payment_provider character varying(50) COLLATE pg_catalog."default",
    provider_subscription_id character varying(255) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(100) COLLATE pg_catalog."default",
    email character varying(150) COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default",
    google_id character varying(255) COLLATE pg_catalog."default",
    profile_pic text COLLATE pg_catalog."default",
    preferred_currency character varying(10) COLLATE pg_catalog."default" DEFAULT 'INR'::character varying,
    country_code character varying(5) COLLATE pg_catalog."default" DEFAULT 'IN'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_plan_id uuid,
    is_premium boolean DEFAULT false,
    role character varying(20) COLLATE pg_catalog."default" DEFAULT 'user'::character varying,
    push_token character varying(255) COLLATE pg_catalog."default",
    upi_id character varying(100) COLLATE pg_catalog."default",
    reset_password_token character varying(255) COLLATE pg_catalog."default",
    reset_password_expires timestamp without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_google_id_key UNIQUE (google_id)
);

CREATE TABLE IF NOT EXISTS public.wallets
(
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    type character varying(50) COLLATE pg_catalog."default" DEFAULT 'Cash'::character varying,
    balance numeric(15, 2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wallets_pkey PRIMARY KEY (id)
);

-- ADD FOREIGN KEYS
ALTER TABLE IF EXISTS public.automation_rules ADD CONSTRAINT automation_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.automation_rules ADD CONSTRAINT automation_rules_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.expense_groups ADD CONSTRAINT expense_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.expense_splits ADD CONSTRAINT expense_splits_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.group_expenses (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.expense_splits ADD CONSTRAINT expense_splits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.group_expenses ADD CONSTRAINT group_expenses_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.expense_groups (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.group_expenses ADD CONSTRAINT group_expenses_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.group_members ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.expense_groups (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.group_members ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.loan_contracts ADD CONSTRAINT loan_contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loan_contracts(user_id);
ALTER TABLE IF EXISTS public.loan_installments ADD CONSTRAINT loan_installments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.loan_contracts (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.loan_installments ADD CONSTRAINT loan_installments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.payments_history ADD CONSTRAINT payments_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.settlements ADD CONSTRAINT settlements_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.expense_groups (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.settlements ADD CONSTRAINT settlements_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.settlements ADD CONSTRAINT settlements_paid_to_fkey FOREIGN KEY (paid_to) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.support_messages ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.support_tickets ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users (id) ON DELETE NO ACTION;
ALTER TABLE IF EXISTS public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
ALTER TABLE IF EXISTS public.transactions ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.user_subscriptions ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans (id) ON DELETE NO ACTION;
ALTER TABLE IF EXISTS public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.wallets ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- Add default Plans back
INSERT INTO plans (name, price_monthly, price_yearly, max_wallets, max_rules, can_auto_emi, can_export_pdf) 
VALUES 
('Free', 0, 0, 2, 2, FALSE, FALSE),
('Pro', 9.99, 99.99, 5, 10, TRUE, TRUE),
('Elite', 19.99, 199.99, 1000, 1000, TRUE, TRUE);

END;
