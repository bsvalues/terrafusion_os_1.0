export const BrandPillars = () =>{const pillars = [
    {
      title: 'Infrastructure Intelligence',
      description:
        'Unified data intelligence that transforms how counties understand and manage their operations.',
      icon: '🏗️',},
    {title: 'Infinite Scalability',
      description:
        'Future-proof architecture that grows seamlessly with your community and operational needs.',
      icon: '♾️',},
    {title: 'Seamless Simplicity',
      description:
        'Complex government operations made intuitive through thoughtful design and workflow automation.',
      icon: '🎯',},
    {title: 'Championship Performance',
      description:
        'Reliable, fast, and secure platform engineered for municipal excellence and public trust.',
      icon: '🏆',},
    {title: 'Omniscient Operations',
      description:
        'Complete operational visibility across all county departments and citizen services.',
      icon: '👁️',},
  ];

  return (<section className="py-20"><div className="container mx-auto px-4"><div className="text-center mb-16"><div className="flex items-center justify-center mb-8"><div className="w-2 h-16 bg-tf-gradient-primary rounded-full shadow-tf-cyan mr-6" /><h2 className="text-5xl font-bold text-white">Brand Pillars</h2><div className="w-2 h-16 bg-tf-gradient-primary rounded-full shadow-tf-cyan ml-6" /></div><p className="text-xl text-muted-foreground max-w-3xl mx-auto">Five foundational principles that define TerraFusion&apos;s approach to transforming
            county government operations.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{pillars.map((pillar, index) => (<div
              key={index}
              className="tf-card rounded-3xl p-8 text-center group relative overflow-hidden"
            >{/* Background gradient effect */}<div className="absolute inset-0 bg-tf-gradient-glow opacity-0 group-hover:opacity-20 transition-opacity duration-500" /><div className="relative z-10">{/* Icon */}<div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{pillar.icon}</div>{/* Title */}<h3 className="text-xl font-semibold text-white mb-4 group-hover:text-primary transition-colors">{pillar.title}</h3>{/* Description */}<p className="text-muted-foreground leading-relaxed">{pillar.description}</p>{/* Underline effect */}<div className="w-0 h-0.5 bg-tf-gradient-primary mx-auto mt-6 group-hover:w-full transition-all duration-500" /></div></div>))}</div>{/* Mission & Vision */}<div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12">{/* Mission */}<div className="tf-card rounded-3xl p-10 relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-1 bg-tf-gradient-primary" /><div className="relative z-10"><h3 className="text-2xl font-bold text-white mb-6 flex items-center"><span className="w-3 h-3 bg-primary rounded-full mr-4"></span>Mission</h3><p className="text-lg text-muted-foreground leading-relaxed">Orchestrate and secure every facet of county operations with a unified, intelligent,
                and infinitely scalable platform—empowering counties to deliver exceptional public
                service.</p><div className="mt-8 inline-flex px-4 py-2 bg-primary/20 text-primary text-sm rounded-full border border-primary/30">Tactical Municipal Excellence</div></div></div>{/* Vision */}<div className="tf-card rounded-3xl p-10 relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-1 bg-tf-gradient-primary" /><div className="relative z-10"><h3 className="text-2xl font-bold text-white mb-6 flex items-center"><span className="w-3 h-3 bg-primary rounded-full mr-4"></span>Vision</h3><p className="text-lg text-muted-foreground leading-relaxed mb-6">Not just modernizing government—transcending it. TerraFusion delivers infrastructure
                intelligence that grows with your community, simplifies every process, and elevates
                public service.</p><div className="text-primary font-semibold text-xl">Government. Transcended.</div></div></div></div>{/* Elevator Pitch */}<div className="mt-16 bg-tf-gradient-primary rounded-3xl p-12 text-center relative overflow-hidden"><div className="absolute inset-0 bg-tf-gradient-glow opacity-40" /><div className="relative z-10"><h3 className="text-3xl font-bold text-primary-foreground mb-6">The TerraFusion Promise</h3><p className="text-xl text-primary-foreground/90 max-w-4xl mx-auto italic leading-relaxed">&quot;TerraFusion is more than software—it&apos;s the neural network of your county,
              orchestrating every operation with championship performance and seamless
              simplicity.&quot;</p></div></div></div></section>
  );
};
