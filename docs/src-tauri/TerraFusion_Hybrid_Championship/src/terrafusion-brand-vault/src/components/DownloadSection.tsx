import {Button} from '@/components/ui/button';

export const DownloadSection = () =>{const downloadItems = [
    {
      title: 'Government Logo Package',
      description: 'All logo variants optimized for municipal use in PNG, SVG, and PDF formats',
      files: '12 files',
      size: '2.4 MB',},
    {title: 'Color Swatches',
      description: 'ASE, ACO, and JSON color files for design tools',
      files: '6 files',
      size: '145 KB',},
    {title: 'Municipal Templates',
      description: 'County letterheads, business cards, and official presentation templates',
      files: '18 files',
      size: '5.2 MB',},
    {title: 'Government Brand Guidelines',
      description: 'Complete PDF guide with municipal usage examples and standards',
      files: '1 file',
      size: '4.8 MB',},
    {title: 'County Operations Icons',
      description: 'Custom government service icons and municipal symbols',
      files: '32 files',
      size: '1.2 MB',},
    {title: 'Portal UI Kit',
      description: 'Government portal components and citizen interface elements',
      files: '24 files',
      size: '3.6 MB',},
  ];

  return (<section className="py-20"><div className="container mx-auto px-4">{/* Download Hero */}<div className="bg-tf-gradient-primary rounded-3xl p-12 text-center mb-16 relative overflow-hidden"><div className="absolute inset-0 bg-tf-gradient-glow opacity-30" /><div className="relative z-10"><h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Download Government Brand Kit</h2><p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">Get all TerraFusion government brand assets in one comprehensive package. Perfect for
              county staff, IT departments, and municipal communications teams.</p><Button
              variant="tf-outline"
              size="hero"
              className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary"
            >Download All Assets</Button></div></div>{/* Individual Downloads */}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{downloadItems.map((item, index) => (<div key={index} className="tf-card rounded-2xl p-6 group cursor-pointer"><div className="flex items-start justify-between mb-4"><div className="flex-1"><h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3><p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p></div><div className="ml-4 text-primary group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{item.files}</span><span className="text-primary font-medium">{item.size}</span></div>{/* Progress bar effect */}<div className="w-full bg-tf-darker-bg rounded-full h-1 mt-4 overflow-hidden"><div className="h-full bg-tf-gradient-primary w-0 group-hover:w-full transition-all duration-1000 ease-out" /></div></div>))}</div>{/* Legal & Usage Info */}<div className="mt-16 tf-card rounded-2xl p-8"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h3 className="text-xl font-semibold text-white mb-4 flex items-center"><svg
                  className="w-5 h-5 text-primary mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>License & Usage</h3><ul className="space-y-2 text-muted-foreground text-sm"><li>• Free for government and municipal development</li><li>• Official use permitted for county operations</li><li>• Maintain brand integrity for public trust</li><li>• Support available for implementation</li></ul></div><div><h3 className="text-xl font-semibold text-white mb-4 flex items-center"><svg
                  className="w-5 h-5 text-primary mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Need Help?</h3><div className="space-y-3"><p className="text-muted-foreground text-sm">Questions about government implementation or need custom municipal assets?</p><div className="flex gap-3"><Button variant="tf-minimal" size="sm">Contact Municipal Team</Button><Button variant="tf-outline" size="sm">View Guidelines</Button></div></div></div></div></div></div></section>
  );
};
