export type ResourceType = 'agents' | 'subagents' | 'skills' | 'mcp_servers' | 'hooks' | 'system_prompts';

export interface Folder {
  id: string;
  name: string;
  type: ResourceType;
  color: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  name: string;
  content: string;
  type: ResourceType;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
