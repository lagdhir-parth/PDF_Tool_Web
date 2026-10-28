export type ToolCategory = 'organize' | 'convert' | 'edit' | 'forms' | 'security';

export interface ToolConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: ToolCategory;
  path: string;
  iconName: string;
  badge?: string;
  accept: Record<string, string[]>;
  maxFiles?: number;
  featured?: boolean;
}
