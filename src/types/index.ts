export type ResourceType = 'agents' | 'subagents' | 'skills' | 'mcp_servers' | 'hooks' | 'system_prompts';

export interface Resource {
  id: string;
  name: string;
  content: string;
  type: ResourceType;
  folderPath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreeNode {
  id: string;
  name: string;
  type: ResourceType;
  children?: TreeNode[];
  isFolder?: boolean;
  resource?: Resource;
}
