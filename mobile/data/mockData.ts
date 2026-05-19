export type System = {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  category: string;
  tagline: string;
  description: string;
  startingPrice: string;
  pricingTier: 'Free' | 'Paid' | 'Enterprise';
  fit: string;
  deployment: 'Cloud' | 'On-Prem' | 'Hybrid';
  compliance: string[];
  integrations: string[];
  verified: boolean;
};

export const mockSystems: System[] = [
  {
    id: '1', slug: 'acme-crm', name: 'Acme CRM', vendor: 'Acme Inc.',
    category: 'CRM', tagline: 'Sales pipelines made simple.',
    description: 'Modern CRM for SMB and mid-market sales teams.',
    startingPrice: '$15/seat/mo', pricingTier: 'Paid',
    fit: 'SMB to mid-market', deployment: 'Cloud',
    compliance: ['SOC 2', 'GDPR'], integrations: ['Slack', 'Gmail', 'HubSpot'],
    verified: true,
  },
  {
    id: '2', slug: 'northwind-erp', name: 'Northwind ERP', vendor: 'Northwind',
    category: 'ERP', tagline: 'Finance, inventory, and operations unified.',
    description: 'Full-stack ERP for manufacturing and distribution.',
    startingPrice: 'Custom', pricingTier: 'Enterprise',
    fit: 'Enterprise', deployment: 'Hybrid',
    compliance: ['SOC 2', 'ISO 27001'], integrations: ['SAP', 'Oracle'],
    verified: true,
  },
  {
    id: '3', slug: 'flowdesk', name: 'FlowDesk', vendor: 'FlowDesk Labs',
    category: 'Helpdesk', tagline: 'Ticketing built for product teams.',
    description: 'Lightweight helpdesk with deep GitHub integration.',
    startingPrice: 'Free', pricingTier: 'Free',
    fit: 'Startups', deployment: 'Cloud',
    compliance: ['GDPR'], integrations: ['GitHub', 'Linear'],
    verified: false,
  },
  {
    id: '4', slug: 'datavault', name: 'DataVault', vendor: 'DataVault Co.',
    category: 'Analytics', tagline: 'Warehouse-native analytics.',
    description: 'BI on top of Snowflake / BigQuery.',
    startingPrice: '$99/mo', pricingTier: 'Paid',
    fit: 'Mid-market', deployment: 'Cloud',
    compliance: ['SOC 2', 'HIPAA'], integrations: ['Snowflake', 'BigQuery'],
    verified: true,
  },
  {
    id: '5', slug: 'gatekeeper', name: 'Gatekeeper IAM', vendor: 'Gatekeeper',
    category: 'Security', tagline: 'Identity and access for cloud apps.',
    description: 'SSO, MFA, and access governance.',
    startingPrice: '$4/user/mo', pricingTier: 'Paid',
    fit: 'All sizes', deployment: 'Cloud',
    compliance: ['SOC 2', 'ISO 27001', 'GDPR'], integrations: ['Okta', 'Azure AD'],
    verified: true,
  },
];

export const mockScraperItems = [
  { id: 's1', name: 'Unknown CRM Tool', source: 'crawler-001', confidence: 0.82, status: 'pending' },
  { id: 's2', name: 'BetaERP', source: 'crawler-002', confidence: 0.91, status: 'pending' },
  { id: 's3', name: 'Acme CRM (dup?)', source: 'crawler-001', confidence: 0.55, status: 'review' },
];

export const mockDeletions = [
  { id: 'd1', user: 'alex@acme.com', requested: '2026-05-12', status: 'pending' },
  { id: 'd2', user: 'jane@northwind.com', requested: '2026-05-10', status: 'approved' },
];

export const mockThreads = [
  { id: 't1', subject: 'Pricing question — Acme CRM', from: 'buyer@bigco.com', updated: '2h ago', unread: true },
  { id: 't2', subject: 'Integration with Linear?', from: 'pm@startup.io', updated: '1d ago', unread: false },
];

export const mockAudit = [
  { id: 'a1', actor: 'admin@prism.io', action: 'approved_system', target: 'Acme CRM', at: '2026-05-18 10:21' },
  { id: 'a2', actor: 'mod@prism.io', action: 'merged_duplicate', target: 'BetaERP → Northwind ERP', at: '2026-05-18 09:02' },
];
