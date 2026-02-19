/**
 * ESLint rule: no-raw-colors
 *
 * Disallow raw hex colors and arbitrary Tailwind color classes in UI code.
 * Forces use of TerraFusion Lumin tokens (CSS custom properties) or @terrafusion/ui primitives.
 *
 * Reports on:
 *   - Raw hex literals (#fff, #0b0f1a, etc.)
 *   - Arbitrary Tailwind color classes: bg-[#...], text-[rgba(...)], border-[hsla(...)], etc.
 *
 * Allows:
 *   - Token-referencing classes: bg-[hsl(var(--tf-surface)/0.8)]
 *   - Standard Tailwind palette classes: bg-white, text-gray-500
 */

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

// Matches arbitrary Tailwind color classes with raw color values,
// but allows hsl(var(--...)) / hsla(var(--...)) token references.
const TW_ARBITRARY_COLOR_RE =
  /\b(?:bg|text|border|ring|from|via|to)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)).*?\]/;

// Detect hsla?(...) with literal numbers (not var()), e.g. hsl(210, 50%, 30%)
const TW_ARBITRARY_HSL_LITERAL_RE =
  /\b(?:bg|text|border|ring|from|via|to)-\[hsla?\(\s*\d/;

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw hex colors and arbitrary Tailwind colors in UI code. Use TerraFusion Lumin tokens.',
    },
    schema: [],
    messages: {
      noRawHex:
        'Raw hex color detected. Use TerraFusion Lumin tokens (CSS vars) or @terrafusion/ui primitives.',
      noArbitraryColor:
        'Arbitrary Tailwind color detected (e.g., bg-[#...]). Use Lumin tokens (CSS vars) or @terrafusion/ui primitives.',
    },
  },

  create(context) {
    function checkText(node, text) {
      if (HEX_RE.test(text)) {
        context.report({ node, messageId: 'noRawHex' });
      }
      if (TW_ARBITRARY_COLOR_RE.test(text) || TW_ARBITRARY_HSL_LITERAL_RE.test(text)) {
        context.report({ node, messageId: 'noArbitraryColor' });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkText(node, node.value);
        }
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.raw).join('${}');
        checkText(node, raw);
      },
    };
  },
};

export default rule;
