export type MockSystem = {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  tagline: string;
  description: string;
  category: string;
  pricingTier: 'Free' | '$' | '$$' | '$$$';
  deployment: 'Cloud' | 'On-prem' | 'Hybrid';
  fit: 'SMB' | 'Mid' | 'Enterprise';
  startingPrice: string;
  verified: boolean;
  freeTrial: boolean;
  rating: number;
  compliance: string[];
  integrations: string[];
};

export const mockSystems: MockSystem[] = [
  {
    id: '1', slug: 'nimbus-crm', name: 'Nimbus CRM', vendor: 'Nimbus Labs',
    tagline: 'Modern CRM for growing revenue teams.',
    description: 'Pipeline, contacts, automations, and revenue intelligence in one place. Track deals, manage relationships, and close more revenue with AI-powered insights.',
    category: 'CRM', pricingTier: '$$', deployment: 'Cloud', fit: 'Mid',
    startingPrice: '$29/seat/mo', verified: true, freeTrial: true, rating: 4.6,
    compliance: ['SOC2', 'GDPR'], integrations: ['Slack', 'Gmail', 'HubSpot'],
  },
  {
    id: '2', slug: 'ironvault-erp', name: 'IronVault ERP', vendor: 'Ironvault Systems',
    tagline: 'Enterprise resource planning, finally usable.',
    description: 'Finance, supply chain, HR, and manufacturing modules unified. Modern ERP built for complex enterprise operations without the implementation nightmare.',
    category: 'ERP', pricingTier: '$$$', deployment: 'Hybrid', fit: 'Enterprise',
    startingPrice: 'Custom', verified: true, freeTrial: false, rating: 4.2,
    compliance: ['SOC2', 'ISO27001', 'HIPAA'], integrations: ['Salesforce', 'Workday'],
  },
  {
    id: '3', slug: 'loopdesk', name: 'LoopDesk', vendor: 'Loop Inc.',
    tagline: "Helpdesk that doesn't get in the way.",
    description: 'Omnichannel ticketing with AI triage. Route tickets intelligently, resolve faster, and keep customers happy with minimal agent overhead.',
    category: 'Support', pricingTier: '$', deployment: 'Cloud', fit: 'SMB',
    startingPrice: '$15/seat/mo', verified: false, freeTrial: true, rating: 4.4,
    compliance: ['GDPR'], integrations: ['Slack', 'Zendesk', 'Intercom'],
  },
  {
    id: '4', slug: 'atlas-analytics', name: 'Atlas Analytics', vendor: 'Atlas Data Co.',
    tagline: 'Self-serve BI for product teams.',
    description: 'Warehouse-native dashboards and metrics layer. Build trusted metrics, share interactive dashboards, and empower every team with data.',
    category: 'Analytics', pricingTier: '$$', deployment: 'Cloud', fit: 'Mid',
    startingPrice: '$99/mo', verified: true, freeTrial: true, rating: 4.7,
    compliance: ['SOC2', 'GDPR'], integrations: ['Snowflake', 'BigQuery', 'dbt'],
  },
  {
    id: '5', slug: 'northbeam-hr', name: 'Northbeam HR', vendor: 'Northbeam',
    tagline: 'People ops for distributed teams.',
    description: 'HRIS, payroll, and performance reviews designed for remote-first companies. Manage your people wherever they are.',
    category: 'HR', pricingTier: '$$', deployment: 'Cloud', fit: 'Mid',
    startingPrice: '$8/seat/mo', verified: false, freeTrial: true, rating: 4.1,
    compliance: ['SOC2', 'GDPR'], integrations: ['Slack', 'Okta'],
  },
  {
    id: '6', slug: 'sentinel-secops', name: 'Sentinel SecOps', vendor: 'Sentinel',
    tagline: 'Detection & response, simplified.',
    description: 'SIEM + SOAR with managed detection. Stop threats before they become incidents with AI-powered detection and automated response playbooks.',
    category: 'Security', pricingTier: '$$$', deployment: 'On-prem', fit: 'Enterprise',
    startingPrice: 'Custom', verified: true, freeTrial: false, rating: 4.5,
    compliance: ['SOC2', 'ISO27001', 'HIPAA'], integrations: ['Splunk', 'CrowdStrike'],
  },
];

export const mockWatchlist = ['1', '4'];

export const categories = ['All', 'CRM', 'ERP', 'Analytics', 'Support', 'HR', 'Security'];
