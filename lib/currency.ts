/**
 * FieldMetrik displays amounts in Sri Lankan Rupees (Rs.) throughout the app.
 */
export function formatCurrency(amount: number): string {
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return `Rs. ${formatted}`;
}
