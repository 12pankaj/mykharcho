import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * PDF Safe Currency Formatter
 * Removes Unicode symbols that break jsPDF and uses standard ASCII text (e.g. INR 400.00)
 */
export const formatCurrencySafePDF = (amount: any, currencyCode = 'INR') => {
    const num = parseFloat(amount) || 0;
    return `${currencyCode} ${num.toFixed(2)}`;
};

/**
 * Shared Currency Formatter
 * Supports multiple currencies and locales.
 */
export const formatCurrency = (amount: number, currencyCode = 'INR', countryCode = 'IN') => {
    const locales: { [key: string]: string } = {
        'IN': 'en-IN',
        'US': 'en-US',
        'GB': 'en-GB',
        'AE': 'ar-AE',
    };

    const locale = locales[countryCode] || 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
    }).format(amount);
};

export const TRANSACTION_TYPES = {
    INCOME: 'Income',
    EXPENSE: 'Expense',
    TRANSFER: 'Transfer'
} as const;

export const LOAN_ROLES = {
    LENDER: 'Lender',
    BORROWER: 'Borrower'
} as const;

export const exportToCSV = (transactions: any[], filename = 'transactions_export.csv') => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const rows = transactions.map(tx => [
        new Date(tx.transaction_date).toLocaleDateString(),
        tx.type,
        tx.category || 'Other',
        `${tx.type === 'Income' ? '+' : '-'}${tx.amount}`,
        `"${tx.notes ? tx.notes.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToPDF = (transactions: any[], filename = 'transactions_export.pdf') => {
    const doc = new jsPDF();
    doc.text("Financial Transactions Report", 14, 15);
    
    const headers = [['Date', 'Type', 'Category', 'Amount', 'Notes']];
    const data = transactions.map(tx => [
        new Date(tx.transaction_date).toLocaleDateString(),
        tx.type,
        tx.category || 'Other',
        `${tx.type === 'Income' ? '+' : '-'}${formatCurrencySafePDF(tx.amount, tx.currency || 'INR')}`,
        tx.notes || ''
    ]);

    autoTable(doc, {
        head: headers,
        body: data,
        startY: 20,
    });

    doc.save(filename);
};

export const exportToExcel = (transactions: any[], filename = 'transactions_export.xlsx') => {
    const data = transactions.map(tx => ({
        Date: new Date(tx.transaction_date).toLocaleDateString(),
        Type: tx.type,
        Category: tx.category || 'Other',
        Amount: tx.type === 'Income' ? tx.amount : -tx.amount,
        Notes: tx.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, filename);
};

export const exportLoanStatementToPDF = (contract: any, installments: any[], transactions: any[], currencyCode = 'INR') => {
    const doc = new jsPDF();
    doc.text(`Loan Statement: ${contract.party_name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Role: ${contract.role} | Total Amount: ${formatCurrencySafePDF(contract.total_amount || contract.total_principal, currencyCode)} | Principal: ${formatCurrencySafePDF(contract.total_principal, currencyCode)}`, 14, 22);
    
    const headers = [['Due Date', 'EMI Amount', 'Paid Amount', 'Pending', 'Status']];
    const data = installments.map(emi => {
        const emiAmt = parseFloat(emi.emi_amount);
        const paidAmt = parseFloat(emi.paid_amount);
        return [
            new Date(emi.due_date).toLocaleDateString(),
            formatCurrencySafePDF(emiAmt, currencyCode),
            formatCurrencySafePDF(paidAmt, currencyCode),
            formatCurrencySafePDF(emiAmt - paidAmt, currencyCode),
            emi.status
        ];
    });

    autoTable(doc, {
        head: headers,
        body: data,
        startY: 30,
    });

    if (transactions && transactions.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 30;
        doc.text("Payment Ledger (Transaction History)", 14, finalY + 15);
        
        const txHeaders = [['Date', 'Transaction Type', 'Amount', 'Notes']];
        const txData = transactions.map(tx => [
            new Date(tx.transaction_date).toLocaleDateString(),
            tx.type,
            formatCurrencySafePDF(tx.amount, currencyCode),
            tx.notes
        ]);

        autoTable(doc, {
            head: txHeaders,
            body: txData,
            startY: finalY + 20,
        });
    }

    doc.save(`Loan_Statement_${contract.party_name.replace(/\s+/g, '_')}.pdf`);
};
