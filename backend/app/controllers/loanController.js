const db = require('../config/db');
const whatsappService = require('../services/whatsappService');

// --- LOAN CONTRACTS ---
exports.getContracts = async (req, res) => {
    try {
        const contracts = await db.query(
            'SELECT * FROM loan_contracts WHERE user_id = $1 ORDER BY start_date DESC',
            [req.user.id]
        );
        res.json(contracts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching loans' });
    }
};

exports.createContract = async (req, res) => {
    const { partyName, partyPhone, role, totalPrincipal, interestRate = 0, totalInstallments = 0, startDate, endDate, walletId } = req.body;
    try {
        await db.query('BEGIN');

        const principal = parseFloat(totalPrincipal) || 0;
        if (principal <= 0) throw new Error('Principal amount must be greater than 0');
        
        // 1. Wallet Validation
        let walletRes = null;
        if (walletId) {
            walletRes = await db.query('SELECT balance FROM wallets WHERE id = $1 AND user_id = $2', [walletId, req.user.id]);
            if (walletRes.rows.length === 0) throw new Error('Wallet not found');
            
            if (role === 'Lender' && parseFloat(walletRes.rows[0].balance) < principal) {
                throw new Error('Insufficient wallet balance to lend this principal');
            }
        }

        // Calculate Totals
        const rate = parseFloat(interestRate) || 0;
        if (rate < 0) throw new Error('Interest rate cannot be negative');
        
        const installmentsCount = parseInt(totalInstallments) || 0;
        if (installmentsCount < 0) throw new Error('Installments count cannot be negative');

        const interestAmount = (principal * rate) / 100;
        const totalAmount = principal + interestAmount;

        // Check Plan for Auto-EMI
        const planRes = await db.query(
            'SELECT p.can_auto_emi FROM users u JOIN plans p ON u.current_plan_id = p.id WHERE u.id = $1',
            [req.user.id]
        );
        const canAutoEmi = planRes.rows[0]?.can_auto_emi;

        if (installmentsCount > 0 && !canAutoEmi) {
            throw new Error('Auto-generating EMIs is a premium feature. Please upgrade to Pro or Elite to use this.');
        }

        const newContract = await db.query(
            'INSERT INTO loan_contracts (user_id, party_name, party_phone, role, total_principal, interest_rate, total_amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [req.user.id, partyName, partyPhone, role, principal, rate, totalAmount, startDate || new Date(), endDate || null]
        );

        const contractId = newContract.rows[0].id;
        const contractStartDate = new Date(newContract.rows[0].start_date);

        // Process Principal Disbursement if Wallet is provided
        if (walletId) {
            const txType = role === 'Lender' ? 'Expense' : 'Income'; // Lender gives money out, Borrower gets money in
            const multiplier = txType === 'Income' ? 1 : -1;
            
            await db.query(
                'INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes) VALUES ($1, $2, $3, $4, $5, $6)',
                [req.user.id, walletId, principal, txType, 'Loan Principal', `Principal ${txType === 'Income' ? 'received' : 'disbursed'} for Contract #${contractId}`]
            );

            await db.query(
                'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
                [principal * multiplier, walletId, req.user.id]
            );
        }

        // Auto-generate EMIs
        if (installmentsCount > 0 && canAutoEmi) {
            const emiAmount = totalAmount / installmentsCount;
            for (let i = 1; i <= installmentsCount; i++) {
                const dueDate = new Date(contractStartDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                await db.query(
                    'INSERT INTO loan_installments (user_id, contract_id, due_date, emi_amount) VALUES ($1, $2, $3, $4)',
                    [req.user.id, contractId, dueDate, emiAmount]
                );
            }
        }

        await db.query('COMMIT');
        res.status(201).json(newContract.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(400).json({ message: err.message || 'Error creating loan contract' });
    }
};

exports.deleteContract = async (req, res) => {
    try {
        await db.query('DELETE FROM loan_contracts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Loan deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting loan' });
    }
};

exports.sendReminder = async (req, res) => {
    const { id } = req.params; // Installment ID
    try {
        const emiRes = await db.query(`
            SELECT li.*, lc.party_name, lc.party_phone, lc.role 
            FROM loan_installments li
            JOIN loan_contracts lc ON li.contract_id = lc.id
            WHERE li.id = $1 AND li.user_id = $2
        `, [id, req.user.id]);

        if (emiRes.rows.length === 0) {
            return res.status(404).json({ message: 'Installment not found' });
        }

        const emi = emiRes.rows[0];

        if (!emi.party_phone) {
            return res.status(400).json({ message: 'Borrower phone number is missing' });
        }

        const variables = [
            { type: 'text', text: emi.party_name },
            { type: 'text', text: emi.emi_amount.toString() }
        ];
        
        const success = await whatsappService.sendReminder(emi.party_phone, variables);

        if (success) {
            res.json({ message: 'WhatsApp reminder sent successfully!' });
        } else {
            res.status(500).json({ message: 'Failed to send WhatsApp reminder. Check logs.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending reminder' });
    }
};

exports.updateContract = async (req, res) => {
    const { id } = req.params;
    const { partyName, partyPhone, role, totalPrincipal, interestRate, totalAmount, startDate, endDate } = req.body;
    try {
        const updatedContract = await db.query(
            'UPDATE loan_contracts SET party_name = $1, party_phone = $2, role = $3, total_principal = $4, interest_rate = $5, total_amount = $6, start_date = $7, end_date = $8 WHERE id = $9 AND user_id = $10 RETURNING *',
            [partyName, partyPhone, role, totalPrincipal, interestRate, totalAmount, startDate, endDate, id, req.user.id]
        );
        if (updatedContract.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json(updatedContract.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating loan' });
    }
};

// --- LOAN INSTALLMENTS ---
exports.getInstallments = async (req, res) => {
    try {
        const installments = await db.query(
            'SELECT * FROM loan_installments WHERE contract_id = $1 AND user_id = $2 ORDER BY due_date ASC',
            [req.params.contractId, req.user.id]
        );
        res.json(installments.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching installments' });
    }
};

exports.addInstallment = async (req, res) => {
    const { contractId } = req.params;
    const { dueDate, emiAmount } = req.body;
    try {
        const amount = parseFloat(emiAmount) || 0;
        if (amount <= 0) throw new Error('EMI amount must be greater than 0');

        const contractRes = await db.query('SELECT total_amount FROM loan_contracts WHERE id = $1 AND user_id = $2', [contractId, req.user.id]);
        if (contractRes.rows.length === 0) throw new Error('Contract not found');
        const contract = contractRes.rows[0];

        const existingEmisRes = await db.query('SELECT SUM(emi_amount) as total_emi FROM loan_installments WHERE contract_id = $1', [contractId]);
        const currentEmiTotal = parseFloat(existingEmisRes.rows[0].total_emi || 0);
        
        if (currentEmiTotal + amount > parseFloat(contract.total_amount) + 0.01) {
            throw new Error(`Cannot add EMI. Exceeds total contract amount by ${currentEmiTotal + amount - parseFloat(contract.total_amount)}`);
        }

        const newEmi = await db.query(
            'INSERT INTO loan_installments (user_id, contract_id, due_date, emi_amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, contractId, dueDate, amount]
        );
        res.status(201).json(newEmi.rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Error adding installment' });
    }
};

exports.payInstallment = async (req, res) => {
    const { id } = req.params;
    const { walletId, paidAmount } = req.body; // How much they are paying now
    try {
        const amount = parseFloat(paidAmount) || 0;
        if (amount <= 0) throw new Error('Payment amount must be greater than 0');

        await db.query('BEGIN');
        
        // 1. Get Installment details
        const emiRes = await db.query('SELECT * FROM loan_installments WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (emiRes.rows.length === 0) throw new Error('Installment not found');
        const emi = emiRes.rows[0];

        // Wallet check
        const walletRes = await db.query('SELECT balance FROM wallets WHERE id = $1 AND user_id = $2', [walletId, req.user.id]);
        if (walletRes.rows.length === 0) throw new Error('Wallet not found');

        const contractRes = await db.query('SELECT role FROM loan_contracts WHERE id = $1', [emi.contract_id]);
        const role = contractRes.rows[0].role;
        const txType = role === 'Borrower' ? 'Expense' : 'Income';
        
        if (txType === 'Expense' && parseFloat(walletRes.rows[0].balance) < parseFloat(paidAmount)) {
            throw new Error('Insufficient wallet balance to pay this EMI amount');
        }

        // 2. Update installment status
        const newPaidAmount = parseFloat(emi.paid_amount) + parseFloat(paidAmount);
        const status = newPaidAmount >= parseFloat(emi.emi_amount) ? 'Paid' : 'Partial';
        
        const updatedEmi = await db.query(
            'UPDATE loan_installments SET paid_amount = $1, status = $2, payment_date = NOW() WHERE id = $3 RETURNING *',
            [newPaidAmount, status, id]
        );

        // 3. Create a transaction & update wallet balance
        const multiplier = txType === 'Income' ? 1 : -1;

        await db.query(
            'INSERT INTO transactions (user_id, wallet_id, amount, type, category, notes) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, walletId, paidAmount, txType, 'Loan EMI', `EMI Payment for Contract #${emi.contract_id}`]
        );

        await db.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
            [parseFloat(paidAmount) * multiplier, walletId, req.user.id]
        );

        await db.query('COMMIT');
        res.json(updatedEmi.rows[0]);
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ message: err.message || 'Error processing EMI payment' });
    }
};

exports.deleteInstallment = async (req, res) => {
    try {
        await db.query('DELETE FROM loan_installments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Installment deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting installment' });
    }
};

exports.updateInstallment = async (req, res) => {
    const { id } = req.params;
    const { dueDate, emiAmount, status } = req.body;
    try {
        const updatedEmi = await db.query(
            'UPDATE loan_installments SET due_date = $1, emi_amount = $2, status = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
            [dueDate, emiAmount, status, id, req.user.id]
        );
        res.json(updatedEmi.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error updating installment' });
    }
};
