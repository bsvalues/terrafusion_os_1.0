import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 mt-auto">
      {/* Top gradient border */}<>

      <div className="h-px bg-gradient-to-r from-transparent via-[#0891b2] to-transparent"></div>

      <div
</> className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Terrafusion Branding */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#0891b2] to-[#00d2ff] rounded-lg">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="4" />
                  <path d="M6 8 L12 8 L12 16 M12 8 L18 8 M15 12 L18 16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Terrafusion<span className="text-cyan-300">Pilt</span></h3>
                <p className="text-sm text-slate-400">AI That Understands Land</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Federal PILT management system powered by enterprise-grade AI technology.
              Delivering precision, compliance, and excellence for Benton County.
            </p>
          </div>

          {/* Excellence Standards */}
          <div className="space-y-4"><>

            <h4 className="text-white font-semibold text-lg">Excellence Standards</h4>
            <div
</> className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2"><>

                <div className="w-2 h-2 bg-[#0891b2] rounded-full"></div>
                <span
</> className="text-slate-300 text-sm">Tesla Precision</span>
              </div>
              <div className="flex items-center space-x-2"><>

                <div className="w-2 h-2 bg-[#00d2ff] rounded-full"></div>
                <span
</> className="text-slate-300 text-sm">Jobs Elegance</span>
              </div>
              <div className="flex items-center space-x-2"><>

                <div className="w-2 h-2 bg-[#0891b2] rounded-full"></div>
                <span
</> className="text-slate-300 text-sm">Musk Scale</span>
              </div>
              <div className="flex items-center space-x-2"><>

                <div className="w-2 h-2 bg-[#00d2ff] rounded-full"></div>
                <span
</> className="text-slate-300 text-sm">Brady Excellence</span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-4"><>

            <h4 className="text-white font-semibold text-lg">System Information</h4>
            <div
</> className="space-y-2 text-sm">
              <div className="flex justify-between"><>

                <span className="text-slate-400">Version:</span>
                <span
</> className="text-slate-300 font-mono">v2.0.0</span>
              </div>
              <div className="flex justify-between"><>

                <span className="text-slate-400">Environment:</span>
                <span
</> className="text-green-400 font-mono">Production</span>
              </div>
              <div className="flex justify-between"><>

                <span className="text-slate-400">Status:</span>
                <div
</> className="flex items-center space-x-1"><>

                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span
</> className="text-green-400">Online</span>
                </div>
              </div>
              <div className="flex justify-between"><>

                <span className="text-slate-400">Compliance:</span>
                <span
</> className="text-blue-400">Federal Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-400 text-sm">
              © {new Date().getFullYear()} TerraFusionPilt - Benton County, Washington.
              <span className="ml-2 text-slate-500">Powered by Terrafusion Enterprise.</span>
            </div>
            <div className="flex items-center space-x-6 text-sm"><>

              <span className="text-slate-400">Built with</span>
              <div
</> className="flex items-center space-x-2"><>

                <div className="w-1 h-1 bg-[#0891b2] rounded-full"></div>
                <span
</> className="text-slate-300">React</span>
              </div>
              <div className="flex items-center space-x-2"><>

                <div className="w-1 h-1 bg-[#00d2ff] rounded-full"></div>
                <span
</> className="text-slate-300">TypeScript</span>
              </div>
              <div className="flex items-center space-x-2"><>

                <div className="w-1 h-1 bg-[#0891b2] rounded-full"></div>
                <span
</> className="text-slate-300">TailwindCSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;