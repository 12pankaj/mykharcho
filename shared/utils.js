/**
 * Shared Currency Formatter
 * Supports multiple currencies and locales.
 */
export const formatCurrency = (amount, currencyCode = 'INR', countryCode = 'IN') => {
    const locales = {
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
};

export const LOAN_ROLES = {
    LENDER: 'Lender',
    BORROWER: 'Borrower'
};
