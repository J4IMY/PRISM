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

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'vendor';
  timestamp: string;
};

export type MockConversation = {
  id: string;
  systemId: string;
  systemName: string;
  vendorName: string;
  repName: string;
  repTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: ChatMessage[];
};

export const mockConversations: MockConversation[] = [
  {
    id: 'c1',
    systemId: '1',
    systemName: 'Nimbus CRM',
    vendorName: 'Nimbus Labs',
    repName: 'Sarah Chen',
    repTitle: 'Account Executive',
    lastMessage: 'Happy to set up a custom demo for your team — any time next week work?',
    lastMessageTime: '10:42 AM',
    unread: 2,
    messages: [
      { id: 'm1', sender: 'user', text: 'Hi Sarah, we are evaluating CRMs and Nimbus came up highly rated. Can you walk us through the mid-market tier?', timestamp: 'Mon 9:00 AM' },
      { id: 'm2', sender: 'vendor', text: 'Hi! Thanks for reaching out. Nimbus CRM is a perfect fit for mid-market teams — pipeline management, AI-powered forecasting, and native Slack/Gmail integrations are all included in the Growth plan.', timestamp: 'Mon 9:15 AM' },
      { id: 'm3', sender: 'user', text: 'What does pricing look like for a 25-seat team?', timestamp: 'Mon 9:18 AM' },
      { id: 'm4', sender: 'vendor', text: 'For 25 seats on the Growth plan you are looking at $29/seat/month billed annually, so roughly $725/month. We also offer a free 14-day trial — no card required.', timestamp: 'Mon 9:22 AM' },
      { id: 'm5', sender: 'user', text: 'That sounds reasonable. Do you support SSO and SCIM?', timestamp: 'Mon 9:30 AM' },
      { id: 'm6', sender: 'vendor', text: 'Yes — SSO via SAML 2.0 and SCIM provisioning are both available on the Growth plan and above. We also have SOC 2 Type II and GDPR certifications. Happy to set up a custom demo for your team — any time next week work?', timestamp: 'Mon 10:42 AM' },
    ],
  },
  {
    id: 'c2',
    systemId: '4',
    systemName: 'Atlas Analytics',
    vendorName: 'Atlas Data Co.',
    repName: 'Marcus Webb',
    repTitle: 'Solutions Engineer',
    lastMessage: 'The Snowflake connector is available on all paid plans — no extra cost.',
    lastMessageTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'user', text: 'Hey Marcus, does Atlas support warehouse-native queries directly against Snowflake?', timestamp: 'Fri 2:00 PM' },
      { id: 'm2', sender: 'vendor', text: 'Absolutely — Atlas pushes queries down to Snowflake so no data ever leaves your warehouse. You get live results with full column-level security respected.', timestamp: 'Fri 2:10 PM' },
      { id: 'm3', sender: 'user', text: 'Great. Is the connector included or is it an add-on?', timestamp: 'Fri 2:15 PM' },
      { id: 'm4', sender: 'vendor', text: 'The Snowflake connector is available on all paid plans — no extra cost.', timestamp: 'Fri 2:20 PM' },
    ],
  },
  {
    id: 'c3',
    systemId: '2',
    systemName: 'IronVault ERP',
    vendorName: 'Ironvault Systems',
    repName: 'Priya Rao',
    repTitle: 'Enterprise Sales',
    lastMessage: 'I can share the implementation playbook — typical go-live is 12–16 weeks.',
    lastMessageTime: 'Tue',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'user', text: 'Priya, we are a 500-person manufacturing company looking to replace our legacy ERP. What does a typical IronVault implementation look like?', timestamp: 'Tue 11:00 AM' },
      { id: 'm2', sender: 'vendor', text: 'Great context — IronVault is purpose-built for manufacturing at that scale. We offer Finance, Supply Chain, and Production modules out of the box, with a dedicated implementation team.', timestamp: 'Tue 11:20 AM' },
      { id: 'm3', sender: 'user', text: 'How long is the typical go-live timeline?', timestamp: 'Tue 11:25 AM' },
      { id: 'm4', sender: 'vendor', text: 'I can share the implementation playbook — typical go-live is 12–16 weeks.', timestamp: 'Tue 11:40 AM' },
    ],
  },
  {
    id: 'c4',
    systemId: '6',
    systemName: 'Sentinel SecOps',
    vendorName: 'Sentinel',
    repName: 'Jake Torres',
    repTitle: 'Security Specialist',
    lastMessage: 'We are SOC 2 Type II, ISO 27001, and HIPAA compliant. Happy to share the audit reports.',
    lastMessageTime: 'Mon',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'user', text: 'Jake — what compliance certifications does Sentinel hold? We are in healthcare.', timestamp: 'Mon 3:00 PM' },
      { id: 'm2', sender: 'vendor', text: 'We are SOC 2 Type II, ISO 27001, and HIPAA compliant. Happy to share the audit reports.', timestamp: 'Mon 3:30 PM' },
    ],
  },
];
