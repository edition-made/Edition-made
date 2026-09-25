type WebMCPJsonSchema = Record<string, unknown>;

type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: WebMCPJsonSchema;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    debugging?: boolean;
  };
  execute: (input: Record<string, unknown>, options: { signal: AbortSignal }) => unknown | Promise<unknown>;
};

type WebMCPModelContext = {
  registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal; exposedTo?: string[] }) => Promise<void>;
};

interface Document {
  readonly modelContext?: WebMCPModelContext;
}

interface Navigator {
  readonly modelContext?: WebMCPModelContext;
}
