const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.de",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "outlook.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "aol.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "yandex.ru",
  "mail.ru",
  "inbox.ru",
  "list.ru",
  "bk.ru",
  "tutanota.com",
  "tuta.io",
  "fastmail.com",
  "hey.com",
  "qq.com",
  "163.com",
  "126.com",
  "rediffmail.com",
  "zoho.com",
]);

export function getEmailDomain(email: string): string | null {
  const parts = email.toLowerCase().trim().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

export function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

export function isCompanyEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return !isFreeEmailDomain(domain);
}

export const COMPANY_EMAIL_REQUIRED_MESSAGE =
  "Vendor applications require a company email address (personal email domains like Gmail, Yahoo, and Outlook are not allowed).";
