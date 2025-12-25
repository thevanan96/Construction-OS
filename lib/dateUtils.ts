/**
 * Returns the current date in 'Asia/Colombo' timezone formatted as YYYY-MM-DD.
 * This ensures consistency regardless of the client's local system time or UTC.
 */
export function getSriLankaDate(): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    // en-CA locale formats date as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(new Date());
}
