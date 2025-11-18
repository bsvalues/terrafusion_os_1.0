export const MessagingGuidelines = () =>{const messagingExamples = [
    {
      context: 'Login Banner',
      message: 'Welcome to Government. Transcended.',
      usage: 'Greeting for staff portals and administrative interfaces',},
    {context: 'Dashboard Greeting',
      message: 'Infrastructure Intelligence, Infinite Scale',
      usage: 'Main tagline for executive dashboards and reporting',},
    {context: 'Support Message',
      message: 'Experience Government. Simplified.',
      usage: 'Help desk and citizen support communications',},
    {context: 'Onboarding Welcome',
      message: 'Welcome to TerraFusion—your command center for county excellence.',
      usage: 'New user onboarding and training materials',},
    {context: 'Error Message',
      message:
        'Something went wrong—our infrastructure intelligence is already working to resolve it.',
      usage: 'System error communications that maintain confidence',},
    {context: 'Success Message',
      message: 'Success! Government. Simplified.',
      usage: 'Confirmation messages and positive feedback',},
  ];

  const audienceSegments = [
    {audience: 'County Executives',
      focus:
        'Total operational visibility, data-driven decision making, future-proof infrastructure.',
      tone: 'Strategic, authoritative, results-focused',},
    {audience: 'IT Staff',
      focus: 'Modern architecture, secure automation, resilient deployment, ease of integration.',
      tone: 'Technical, precise, solution-oriented',},
    {audience: 'County Staff',
      focus: 'One-stop access, workflow automation, reliability, user empowerment.',
      tone: 'Supportive, clear, efficiency-focused',},
    {audience: 'Citizens',
      focus: 'Faster services, transparency, security, trust.',
      tone: 'Accessible, reassuring, service-oriented',},
  ];

  return (<section className="py-20"><div className="container mx-auto px-4"><div className="flex items-center mb-12"><div className="w-2 h-16 bg-tf-gradient-primary rounded-full shadow-tf-cyan mr-6" /><h2 className="text-5xl font-bold text-white">Messaging Guidelines</h2></div>{/* Key Messages */}<div className="mb-16"><h3 className="text-2xl font-semibold text-white mb-8">Microcopy Examples</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{messagingExamples.map((example, index) => (<div key={index} className="tf-card rounded-2xl p-6"><div className="flex items-start justify-between mb-4"><h4 className="text-primary font-semibold">{example.context}</h4><div className="w-2 h-2 bg-primary rounded-full"></div></div><p className="text-lg text-white font-medium mb-3 italic">&quot;{example.message}&quot;</p><p className="text-muted-foreground text-sm">{example.usage}</p></div>))}</div></div>{/* Audience Segments */}<div className="mb-16"><h3 className="text-2xl font-semibold text-white mb-8">Audience-Specific Messaging</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{audienceSegments.map((segment, index) => (<div key={index} className="tf-card rounded-2xl p-8"><div className="flex items-center mb-6"><div className="w-4 h-4 bg-tf-gradient-primary rounded-full mr-4"></div><h4 className="text-xl font-semibold text-white">{segment.audience}</h4></div><div className="space-y-4"><div><h5 className="text-primary font-medium mb-2">Key Focus</h5><p className="text-muted-foreground">{segment.focus}</p></div><div><h5 className="text-primary font-medium mb-2">Communication Tone</h5><p className="text-muted-foreground">{segment.tone}</p></div></div></div>))}</div></div>{/* Brand Voice Principles */}<div className="tf-card rounded-3xl p-12"><h3 className="text-2xl font-semibold text-white mb-8 text-center">Brand Voice Principles</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="text-center"><div className="w-16 h-16 bg-tf-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🎯</span></div><h4 className="text-lg font-semibold text-white mb-3">Confident & Capable</h4><p className="text-muted-foreground text-sm">We speak with authority and expertise, reflecting our deep understanding of
                government operations.</p></div><div className="text-center"><div className="w-16 h-16 bg-tf-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🚀</span></div><h4 className="text-lg font-semibold text-white mb-3">Innovative & Forward-Thinking</h4><p className="text-muted-foreground text-sm">We communicate the future of government technology while respecting traditional
                values.</p></div><div className="text-center"><div className="w-16 h-16 bg-tf-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🤝</span></div><h4 className="text-lg font-semibold text-white mb-3">Accessible & Trustworthy</h4><p className="text-muted-foreground text-sm">We use clear, jargon-free language that builds confidence and understanding.</p></div></div><div className="mt-12 p-8 bg-tf-gradient-primary rounded-2xl text-center"><h4 className="text-xl font-bold text-primary-foreground mb-4">Internal Team Motto</h4><p className="text-lg text-primary-foreground/90 italic">&quot;Tactical Municipal Excellence. Every Workflow. Every Day.&quot;</p></div></div></div></section>
  );
};
