export const LogoShowcase = () =>{const logoVariants = [
    {
      title: 'Primary Logo',
      description:
        'Main brand mark for county government platforms. Infrastructure intelligence meets infinite scalability with signature cyan glow.',
      className: 'bg-tf-gradient-primary shadow-tf-glow',
      textClassName: 'text-primary-foreground',
      style: 'primary',},
    {title: 'Government Token',
      description:
        'Municipal platform and portal optimized circular version. Perfect for government applications and official communications.',
      className: 'bg-tf-gradient-primary rounded-full shadow-tf-glow',
      textClassName: 'text-primary-foreground',
      style: 'circular',},
    {title: 'Executive Perspective',
      description:
        'Dimensional version for leadership dashboards and executive presentations. Conveys championship performance and operational excellence.',
      className:
        'bg-tf-gradient-hero transform perspective-1000 rotate-x-12 rotate-y-12 shadow-tf-float',
      textClassName: 'text-white',
      style: '3d',},
    {title: 'Transparent Operations',
      description:
        'Transparent background variant for citizen-facing applications, public portals, and government transparency initiatives.',
      className: 'bg-transparent border-2 border-primary shadow-tf-cyan',
      textClassName: 'text-primary',
      style: 'outline',},
    {title: 'Administrative Minimal',
      description:
        'Subtle version for internal government documentation, staff interfaces, and administrative communications.',
      className: 'bg-tf-dark-bg border border-primary/50 shadow-tf-cyan',
      textClassName: 'text-primary',
      style: 'minimal',},
    {title: 'Public Accessibility',
      description:
        'Maximum contrast version for ADA compliance, public accessibility standards, and universal government access.',
      className: 'bg-black border border-primary shadow-tf-glow',
      textClassName: 'text-primary',
      style: 'contrast',},
  ];

  return (<section className="py-20"><div className="container mx-auto px-4"><div className="flex items-center mb-12"><div className="w-2 h-16 bg-tf-gradient-primary rounded-full shadow-tf-cyan mr-6" /><h2 className="text-5xl font-bold text-white">Complete Logo System</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{logoVariants.map((variant, index) => (<div key={index} className="tf-card rounded-3xl p-8 text-center group">{/* Logo Display */}<div className="relative mb-8"><div
                  className={`w-32 h-32 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${variant.className}`}
                ><span
                    className={`text-4xl font-arial-black font-black tracking-tight ${variant.textClassName}`}
                  >TF</span></div>{/* Hover glow effect */}<div className="absolute inset-0 bg-tf-gradient-glow opacity-0 group-hover:opacity-50 rounded-2xl blur-xl transition-opacity duration-500" /></div>{/* Variant Info */}<h3 className="text-xl font-semibold text-white mb-4">{variant.title}</h3><p className="text-muted-foreground leading-relaxed text-sm">{variant.description}</p>{/* Usage Badge */}<div className="mt-6 inline-flex px-3 py-1 bg-primary/20 text-primary text-xs rounded-full border border-primary/30">{variant.style.toUpperCase()}</div></div>))}</div></div></section>
  );
};
