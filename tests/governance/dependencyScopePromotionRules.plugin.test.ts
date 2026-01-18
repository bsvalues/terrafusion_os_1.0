import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('Dependency Scope Promotion Rules (PLUGIN)', () => {
  const promotionsFiles = [
    'INCREMENT_8_4_1_PLUGIN.json',
    'INCREMENT_8_4_2_PLUGIN.json',
    'INCREMENT_8_4_3_PLUGIN.json',
    'INCREMENT_8_4_4_PLUGIN.json',
  ];

  promotionsFiles.forEach(file => {
    describe(file, () => {
      const promotionsPath = path.resolve(__dirname, `../../scripts/governance/promotions/${file}`);

      it('should load valid promotion rules', () => {
        expect(fs.existsSync(promotionsPath)).toBe(true);
        const content = JSON.parse(fs.readFileSync(promotionsPath, 'utf8'));
        expect(content.promotions).toBeDefined();
        // expect(content.promotions.length).toBe(20); // Both happen to be 20
      });

      it('should target PLUGIN bucket', () => {
        const content = JSON.parse(fs.readFileSync(promotionsPath, 'utf8'));
        content.promotions.forEach(p => {
          expect(p.target).toBe('PLUGIN');
        });
      });
    });
  });

  it('should not contain cross-file duplicates (collision policy)', () => {
    const allPromotions = new Set<string>();
    const promotionsFiles = fs
      .readdirSync(path.resolve(__dirname, '../../scripts/governance/promotions'))
      .filter(f => f.endsWith('.json'))
      .sort(); // Match runtime behavior

    promotionsFiles.forEach(file => {
      const p = path.resolve(__dirname, `../../scripts/governance/promotions/${file}`);
      const content = JSON.parse(fs.readFileSync(p, 'utf8'));
      content.promotions.forEach((promo: any) => {
        expect(allPromotions.has(promo.package)).toBe(false); // Fail if duplicate
        allPromotions.add(promo.package);
      });
    });
  });

  describe('Specific Rules Validation', () => {
    it('8.4.1 should only target applications/*', () => {
      const p = path.resolve(
        __dirname,
        '../../scripts/governance/promotions/INCREMENT_8_4_1_PLUGIN.json'
      );
      const content = JSON.parse(fs.readFileSync(p, 'utf8'));
      content.promotions.forEach(item => {
        expect(item.package.startsWith('applications/')).toBe(true);
      });
    });

    it('8.4.2 should target low-risk items (tools, workspaces, etc)', () => {
      const p = path.resolve(
        __dirname,
        '../../scripts/governance/promotions/INCREMENT_8_4_2_PLUGIN.json'
      );
      const content = JSON.parse(fs.readFileSync(p, 'utf8'));
      content.promotions.forEach(item => {
        // verifying they are not critical core paths
        expect(item.package).not.toMatch(/^os-kernel/);
        expect(item.package).not.toMatch(/^terrafusion-cos/);
      });
    });

    it('8.4.4 should target workspace shells', () => {
      const p = path.resolve(
        __dirname,
        '../../scripts/governance/promotions/INCREMENT_8_4_4_PLUGIN.json'
      );
      const content = JSON.parse(fs.readFileSync(p, 'utf8'));
      content.promotions.forEach(item => {
        expect(item.package.startsWith('workspaces/')).toBe(true);
      });
    });
  });
});
