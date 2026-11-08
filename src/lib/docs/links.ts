// The links a use case may hold in its text: a page of the site, a section of the page, a web
// address or an email. Anything else (javascript:, data:, a percent-encoded scheme) stays text.

export const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

// A path of the site starts with one slash: //host is another site, \ is not a path
const SAFE = /^(?:\/(?!\/|\\)|#|https:\/\/|http:\/\/|mailto:)/i;

export const isSafeHref = (href: string) => SAFE.test(href);
