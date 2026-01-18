import { describe, expect, it } from 'vitest';
import { parseTaxonomy } from '../../scripts/governance/dotnetWarningTaxonomy.mjs';

describe('DotnetWarningTaxonomyParser', () => {
  it('should parse a standard warning line correctly', () => {
    const input = `C:\\Users\\bsval\\terrafusion_os_1.0\\backend\\src\\TerraFusion.AI\\Services\\AutoRecoveryOrchestrator.cs(790,23): warning CS8618: Non-nullable property 'WorkflowType' must contain a non-null value when exiting constructor. [C:\\Users\\bsval\\terrafusion_os_1.0\\backend\\src\\TerraFusion.AI\\TerraFusion.AI.csproj]`;

    const result = parseTaxonomy(input);

    expect(result.totalWarnings).toBe(1);
    expect(result.byCode['CS8618']).toBe(1);

    const project = 'backend/src/TerraFusion.AI/TerraFusion.AI.csproj'; // Expect normalized path if possible, or match what comes out
    // Actually, let's see how we implement normalization. For now, testing the structure.
  });

  it('should aggregate multiple warnings', () => {
    const input = `
C:\\File1.cs(1,1): warning CS0001: Msg1 [Proj1.csproj]
C:\\File2.cs(1,1): warning CS0001: Msg2 [Proj1.csproj]
C:\\File3.cs(1,1): warning CS0002: Msg3 [Proj2.csproj]
    `;

    const result = parseTaxonomy(input);

    expect(result.totalWarnings).toBe(3);
    expect(result.byCode['CS0001']).toBe(2);
    expect(result.byCode['CS0002']).toBe(1);

    expect(result.byProject['Proj1.csproj'].total).toBe(2);
    expect(result.byProject['Proj2.csproj'].total).toBe(1);
  });

  it('should handle lines that are not warnings', () => {
    const input = `
Build started...
Some info message
C:\\File1.cs(1,1): warning CS0001: Msg1 [Proj1.csproj]
Build succeeded.
    `;
    const result = parseTaxonomy(input);
    expect(result.totalWarnings).toBe(1);
  });
});
