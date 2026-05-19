export type MockSystem = {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  tagline: string;
  description: string;
  category: string;
  pricingTier: "Free" | "$" | "$$" | "$$$";
  deployment: "Cloud" | "On-prem" | "Hybrid";
  fit: "SMB" | "Mid" | "Enterprise";
  startingPrice: string;
  verified: boolean;
  freeTrial: boolean;
  rating: number;
  compliance: string[];
  integrations: string[];
};

export const mockSystems: MockSystem[] = [
  {
    id: "1", slug: "nimbus-crm", name: "Nimbus CRM", vendor: "Nimbus Labs",
    tagline: "Modern CRM for growing revenue teams.",
    description: "Pipeline, contacts, automations, and revenue intelligence in one place.",
    category: "CRM", pricingTier: "$$", deployment: "Cloud", fit: "Mid",
    startingPrice: "$29/seat/mo", verified: true, freeTrial: true, rating: 4.6,
    compliance: ["SOC2", "GDPR"], integrations: ["Slack", "Gmail", "HubSpot"],
  },
  {
    id: "2", slug: "ironvault-erp", name: "IronVault ERP", vendor: "Ironvault Systems",
    tagline: "Enterprise resource planning, finally usable.",
    description: "Finance, supply chain, HR, and manufacturing modules.",
    category: "ERP", pricingTier: "$$$", deployment: "Hybrid", fit: "Enterprise",
    startingPrice: "Custom", verified: true, freeTrial: false, rating: 4.2,
    compliance: ["SOC2", "ISO27001", "HIPAA"], integrations: ["Salesforce", "Workday"],
  },
  {
    id: "3", slug: "loopdesk", name: "LoopDesk", vendor: "Loop Inc.",
    tagline: "Helpdesk that doesn't get in the way.",
    description: "Omnichannel ticketing with AI triage.",
    category: "Support", pricingTier: "$", deployment: "Cloud", fit: "SMB",
    startingPrice: "$15/seat/mo", verified: false, freeTrial: true, rating: 4.4,
    compliance: ["GDPR"], integrations: ["Slack", "Zendesk", "Intercom"],
  },
  {
    id: "4", slug: "atlas-analytics", name: "Atlas Analytics", vendor: "Atlas Data Co.",
    tagline: "Self-serve BI for product teams.",
    description: "Warehouse-native dashboards and metrics layer.",
    category: "Analytics", pricingTier: "$$", deployment: "Cloud", fit: "Mid",
    startingPrice: "$99/mo", verified: true, freeTrial: true, rating: 4.7,
    compliance: ["SOC2", "GDPR"], integrations: ["Snowflake", "BigQuery", "dbt"],
  },
  {
    id: "5", slug: "northbeam-hr", name: "Northbeam HR", vendor: "Northbeam",
    tagline: "People ops for distributed teams.",
    description: "HRIS, payroll, and performance reviews.",
    category: "HR", pricingTier: "$$", deployment: "Cloud", fit: "Mid",
    startingPrice: "$8/seat/mo", verified: false, freeTrial: true, rating: 4.1,
    compliance: ["SOC2", "GDPR"], integrations: ["Slack", "Okta"],
  },
  {
    id: "6", slug: "sentinel-secops", name: "Sentinel SecOps", vendor: "Sentinel",
    tagline: "Detection & response, simplified.",
    description: "SIEM + SOAR with managed detection.",
    category: "Security", pricingTier: "$$$", deployment: "On-prem", fit: "Enterprise",
    startingPrice: "Custom", verified: true, freeTrial: false, rating: 4.5,
    compliance: ["SOC2", "ISO27001", "HIPAA"], integrations: ["Splunk", "CrowdStrike"],
  },
];

export const mockScraperItems = [
  { id: "s1", name: "FlowForge", source: "g2.com", confidence: 0.92, ageDays: 2, status: "in_review" },
  { id: "s2", name: "Quanta CRM", source: "capterra.com", confidence: 0.71, ageDays: 5, status: "scraped" },
  { id: "s3", name: "Beacon ERP", source: "softwareadvice.com", confidence: 0.88, ageDays: 1, status: "ready" },
  { id: "s4", name: "Vivid BI", source: "g2.com", confidence: 0.64, ageDays: 9, status: "scraped" },
];

export const mockDeletionRequests = [
  { id: "d1", email: "a***@acme.com", requestedAt: "2026-05-04", slaDaysLeft: 16, status: "pending" },
  { id: "d2", email: "j***@globex.io", requestedAt: "2026-05-10", slaDaysLeft: 22, status: "pending" },
];

export const mockThreads = [
  { id: "t1", with: "Acme Corp", subject: "Pricing for 250 seats", lastMessage: "Can you share an annual quote?", unread: 2, updated: "2h" },
  { id: "t2", with: "Globex", subject: "SOC2 report request", lastMessage: "Attached. Let me know if you need ISO too.", unread: 0, updated: "1d" },
  { id: "t3", with: "Admin · PRISM", subject: "Verification submitted", lastMessage: "We'll review within 3 business days.", unread: 0, updated: "3d" },
];

export const mockAuditLog = [
  { id: "a1", actor: "admin@prism.io", action: "published_system", target: "FlowForge", at: "2026-05-17 14:22" },
  { id: "a2", actor: "mod@prism.io", action: "rejected_scraper_item", target: "Vivid BI", at: "2026-05-17 13:10" },
  { id: "a3", actor: "admin@prism.io", action: "verified_vendor", target: "Nimbus Labs", at: "2026-05-16 09:01" },
];
