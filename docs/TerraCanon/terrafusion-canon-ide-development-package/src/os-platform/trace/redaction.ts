const SECRET_PATTERNS = [
  /(?<key>api[_-]?key|token|secret|password)\s*[:=]\s*(?<value>[^\s]+)/gi,
  /(?<prefix>Bearer\s+)(?<value>[A-Za-z0-9._-]+)/g,
  /(?<prefix>postgres:\/\/)[^\s]+/g
];

export function redactText(input: string): string {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (...args) => {
      const groups = args.at(-1) as Record<string, string> | undefined;
      if (groups?.key) return `${groups.key}=REDACTED`;
      if (groups?.prefix) return `${groups.prefix}REDACTED`;
      return 'REDACTED';
    });
  }
  return output;
}
