// Export all project components
export { default as ProjectHeader } from './ProjectHeader';
export { default as ProjectDetails } from './ProjectDetails';
export { default as ProjectFiles } from './ProjectFiles';
export { default as ProposalCard } from './ProposalCard';
export { default as ProposalTabs } from './ProposalTabs';

// Export types and utilities
export { getStatusBadge } from './ProjectHeader';
export { getProposalStatusBadge } from './ProposalCard';
export type { SafeProposal } from './ProposalCard';
export type { ProjectFile } from './ProjectFiles'; 