/**
 * Utility functions for phone number and identifier formatting
 */

/**
 * Formats a phone number input for the UI, automatically adding +998 prefix
 * if missing and adding spaces for readability.
 * @param {string} text - The raw input text
 * @returns {string} The formatted phone number or the original text if it's an email
 */
export const formatPhone = (text) => {
  if (!text) return '';

  // If it contains letters or @, treat it as an email/username and don't format
  if (/[a-zA-Z@]/.test(text)) {
    return text;
  }

  // Handle cases where +998 is not yet present
  if (!text.startsWith('+998')) {
    if (text.startsWith('+')) {
      return text;
    } else if (text.length > 0) {
      const digits = text.replace(/[^\d]/g, '');
      return digits ? `+998 ${digits}` : text;
    }
    return '';
  }

  // Format the number with spaces: +998 XX XXX XX XX
  const cleaned = text.replace(/[^\d]/g, '');
  let formatted = '+';
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 5);
  if (cleaned.length > 5) formatted += ' ' + cleaned.substring(5, 8);
  if (cleaned.length > 8) formatted += ' ' + cleaned.substring(8, 10);
  if (cleaned.length > 10) formatted += ' ' + cleaned.substring(10, 12);
  return formatted;
};

/**
 * Cleans a phone number or email for API submission.
 * Removes spaces and non-essential characters from phone numbers.
 * @param {string} text - The raw input text
 * @returns {string} The cleaned identifier
 */
export const cleanIdentifier = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Remove everything except digits and the '+' sign
  return trimmed.replace(/[^\d+]/g, '');
};
