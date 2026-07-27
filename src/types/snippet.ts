export interface CommandSnippet {
  id: string;
  name: string;
  command: string;
  description?: string | undefined;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SnippetInput {
  name: string;
  command: string;
  description?: string | undefined;
  tags?: string[] | undefined;
}

export interface SnippetPatch {
  name?: string | undefined;
  command?: string | undefined;
  description?: string | null;
  tags?: string[] | undefined;
}
