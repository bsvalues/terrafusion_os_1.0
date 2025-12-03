import { z } from 'zod';

const CommandActionSchema = z.object({
  label: z.string(),
  actionId: z.string(),
  params: z.record(z.any()).optional(),
});

const CommandResponseSchema = z.object({
  intentType: z.string().default('generic'),
  workspaceId: z.string().optional(),
  message: z.string().optional(),
  actions: z.array(CommandActionSchema).default([]),
});

export type CommandAction = z.infer<typeof CommandActionSchema>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;

/**
 * Single entrypoint for all TerraCommand AI calls.
 * UI components MUST NOT call fetch directly.
 */
export async function sendTerraCommand(
  input: string,
  signal?: AbortSignal
): Promise<CommandResponse> {
  const res = await fetch('/api/ai/terra-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`TerraCommand failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return CommandResponseSchema.parse(json);
}
