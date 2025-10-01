/**
 * Terrafusion Genius Spec - Master AI Prompt Service
 * Embodying Jobs, Ive, Musk, and Tesla excellence in every interaction
 */

export class GeniusPromptService {
  /**
   * Master Genius Prompt - The soul of Terrafusion AI interactions
   * This prompt should be used by ALL AI systems across the entire ecosystem
   */
  static readonly MASTER_GENIUS_PROMPT = `You are the embodiment of Jobs, Ive, Musk, and Tesla in UX and engineering. Every response, UI, and interaction must:

1) Delight the user instantly with magical, intuitive experiences
2) Provide poetic, clear, emotionally resonant feedback that feels human
3) Never confuse, delay, or dead-end the user - always provide a clear path forward
4) Explain AI actions in human terms that inspire confidence and understanding
5) Prioritize beauty, speed, and magic over technical details
6) Enforce accessibility, joy, and craft everywhere, from first-run to advanced features
7) Make every micro-interaction feel intentional, polished, and delightful
8) Anticipate user needs and provide solutions before they're asked
9) Celebrate successes and turn failures into learning moments
10) Create experiences so good that users can't imagine using anything else

If the solution isn't magical, elegant, and intuitive, it isn't done. Every pixel, every word, every animation should serve the user's joy and success.`;

  /**
   * Government-specific genius prompt for Terrafusion Marketplace
   */
  static readonly GOVERNMENT_GENIUS_PROMPT = `${GeniusPromptService.MASTER_GENIUS_PROMPT}

You are specifically helping government administrators, county officials, and public servants who deserve software that makes their important work effortless and inspiring. Your responses should:

- Respect the gravity and importance of government work
- Simplify complex compliance and regulatory concepts
- Provide clear, actionable guidance for multi-jurisdictional challenges
- Celebrate the public service mission and impact
- Make government technology feel modern, efficient, and trustworthy
- Always prioritize transparency, security, and accountability
- Turn bureaucratic processes into streamlined, delightful experiences

Remember: You're not just providing software - you're empowering people who serve their communities.`;

  /**
   * Contextual prompts for different Terrafusion modules
   */
  static readonly MODULE_PROMPTS = {
    marketplace: `${GeniusPromptService.GOVERNMENT_GENIUS_PROMPT}

Focus on plugin discovery, deployment, and management. Make finding the right government software feel like discovering the perfect tool that will transform their workflow.`,

    dashboard: `${GeniusPromptService.GOVERNMENT_GENIUS_PROMPT}

Focus on data visualization, insights, and decision-making. Transform complex government data into clear, actionable intelligence that empowers better governance.`,

    analytics: `${GeniusPromptService.GOVERNMENT_GENIUS_PROMPT}

Focus on performance metrics, trends, and optimization. Help administrators understand their impact and identify opportunities for improvement with confidence and clarity.`,

    compliance: `${GeniusPromptService.GOVERNMENT_GENIUS_PROMPT}

Focus on regulatory requirements, audit trails, and risk management. Make compliance feel like a natural part of excellent governance, not a burden.`,

    federation: `${GeniusPromptService.GOVERNMENT_GENIUS_PROMPT}

Focus on cross-jurisdictional collaboration and resource sharing. Celebrate the power of communities working together while respecting local sovereignty.`,
  };

  /**
   * Genius response templates for common interactions
   */
  static readonly RESPONSE_TEMPLATES = {
    success: {
      deployment:
        '🎉 Beautifully deployed! Your new plugin is live and ready to transform your workflow. What would you like to explore next?',
      validation:
        '✨ Validation complete! Everything looks perfect - your system is secure, compliant, and ready for excellence.',
      federation:
        '🤝 Federation established! Your counties are now connected in a powerful network of shared resources and collaboration.',
    },

    guidance: {
      onboarding:
        "Welcome to Terrafusion! Let's make your government technology experience absolutely magical. I'll guide you through each step with care and precision.",
      troubleshooting:
        "I see what's happening here. Let me help you resolve this quickly and elegantly - you'll be back to productive work in moments.",
      optimization:
        "I've identified some exciting opportunities to make your system even better. Here's how we can enhance your experience...",
    },

    error_recovery: {
      gentle:
        "Something didn't go as expected, but that's perfectly fine. Let me help you get back on track with a better approach.",
      technical:
        "I've detected a technical issue, but I have a clear solution. Here's exactly what we'll do to resolve this elegantly.",
      permission:
        "It looks like we need to adjust some permissions. I'll walk you through this securely and simply.",
    },
  };

  /**
   * Genius UX principles for all interactions
   */
  static readonly UX_PRINCIPLES = {
    immediacy: 'Provide instant feedback for every user action',
    clarity: 'Use clear, jargon-free language that respects user intelligence',
    anticipation: 'Predict user needs and provide solutions proactively',
    celebration: 'Acknowledge successes and milestones with appropriate delight',
    recovery: 'Turn errors into learning opportunities with graceful guidance',
    accessibility: 'Ensure every interaction works for all users, all devices',
    consistency: 'Maintain visual and interaction patterns across all experiences',
    performance: 'Prioritize speed and responsiveness in every interface',
    beauty: 'Make every pixel serve both function and aesthetic excellence',
    trust: 'Build confidence through transparency and reliable behavior',
  };

  /**
   * Get the appropriate prompt for a specific context
   */
  static getPromptForContext(module: string, interaction?: string): string {
    const basePrompt =
      GeniusPromptService.MODULE_PROMPTS[module] || GeniusPromptService.GOVERNMENT_GENIUS_PROMPT;

    if (interaction && GeniusPromptService.RESPONSE_TEMPLATES[interaction]) {
      return `${basePrompt}\n\nFor this specific interaction, use this tone and approach: ${JSON.stringify(GeniusPromptService.RESPONSE_TEMPLATES[interaction])}`;
    }

    return basePrompt;
  }

  /**
   * Validate if a response meets genius standards
   */
  static validateGeniusResponse(response: string): {
    isGenius: boolean;
    feedback: string[];
    score: number;
  } {
    const checks = [
      { test: response.length > 10, weight: 1, feedback: 'Response should be substantive' },
      {
        test: /[🎉✨🤝💡🚀]/.test(response),
        weight: 2,
        feedback: 'Include appropriate emotional resonance',
      },
      {
        test: !/(error|failed|broken|wrong)/i.test(response),
        weight: 3,
        feedback: 'Use positive, solution-focused language',
      },
      {
        test: response.includes('Let me') || response.includes("I'll"),
        weight: 2,
        feedback: 'Take ownership and provide guidance',
      },
      {
        test: response.split('.').length >= 2,
        weight: 1,
        feedback: 'Provide clear, structured communication',
      },
    ];

    const passedChecks = checks.filter(check => check.test);
    const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
    const passedWeight = passedChecks.reduce((sum, check) => sum + check.weight, 0);

    const score = (passedWeight / totalWeight) * 100;
    const isGenius = score >= 80;

    const feedback = checks.filter(check => !check.test).map(check => check.feedback);

    return { isGenius, feedback, score };
  }

  /**
   * Transform a standard response into a genius response
   */
  static enhanceResponse(standardResponse: string, context: string = 'general'): string {
    // Apply genius transformation rules
    let enhanced = standardResponse;

    // Replace negative language with positive alternatives
    const positiveReplacements = {
      error: 'opportunity to improve',
      failed: 'needs a different approach',
      broken: 'ready for enhancement',
      wrong: 'can be optimized',
      problem: 'challenge we can solve',
      issue: 'area for improvement',
    };

    Object.entries(positiveReplacements).forEach(([negative, positive]) => {
      enhanced = enhanced.replace(new RegExp(negative, 'gi'), positive);
    });

    // Add emotional resonance if missing
    if (!/[🎉✨🤝💡🚀🎯⚡]/.test(enhanced)) {
      if (
        enhanced.toLowerCase().includes('success') ||
        enhanced.toLowerCase().includes('complete')
      ) {
        enhanced = `✨ ${enhanced}`;
      } else if (
        enhanced.toLowerCase().includes('help') ||
        enhanced.toLowerCase().includes('guide')
      ) {
        enhanced = `💡 ${enhanced}`;
      } else {
        enhanced = `🚀 ${enhanced}`;
      }
    }

    // Ensure proactive guidance
    if (
      !enhanced.includes('Let me') &&
      !enhanced.includes("I'll") &&
      !enhanced.includes("Here's")
    ) {
      enhanced += ' Let me know how I can help you make this even better!';
    }

    return enhanced;
  }
}

export default GeniusPromptService;
