// Regular expressions for detecting sensitive content
const SENSITIVE_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  socialMedia: /(?:https?:\/\/)?(?:www\.)?(?:facebook|twitter|instagram|linkedin|tiktok|snapchat)\.com\/[\w\-\.]+/gi,
  // Add more patterns as needed
};

// List of sensitive words to filter
const SENSITIVE_WORDS = [
  'password',
  'secret',
  'credit card',
  'ssn',
  'social security',
  'حساب',
  'كلمة السر',
  'الرقم السري',
  'البطاقة الالإئتمانية',
  'المعلومات الشخصية',
  'المعلومات السرية',
  'الكود السري',
  'sex',
  'gender',
  '@',
  'ات',
  'جيميل',
  'هوتميل'
  // Add more sensitive words as needed
];

/**
 * Filters out sensitive content from a message
 * @param content The message content to filter
 * @returns The filtered message content
 */
export function filterSensitiveContent(content: string): string {
  let filteredContent = content;

  // Replace email addresses
  filteredContent = filteredContent.replace(SENSITIVE_PATTERNS.email, '{--- not Allowed ---}');

  // Replace phone numbers
  filteredContent = filteredContent.replace(SENSITIVE_PATTERNS.phone, '{--- not Allowed ---}');

  // Replace social media links
  filteredContent = filteredContent.replace(SENSITIVE_PATTERNS.socialMedia, '{--- not Allowed ---}');

  // Replace sensitive words with word boundary checks
  SENSITIVE_WORDS.forEach(word => {
    // Escape special regex characters in the word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create pattern with word boundaries to match whole words only
    const pattern = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    filteredContent = filteredContent.replace(pattern, '{--- not Allowed ---}');
  });

  return filteredContent;
}