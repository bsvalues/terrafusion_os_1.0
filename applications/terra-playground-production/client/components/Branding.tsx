import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { z } from 'zod';

const BrandingConfigSchema = z.object({
  logo: z.string(),
  tagline: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  animationDuration: z.number().default(2000)
});

export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;

interface BrandingProps {
  config: BrandingConfig;
  onAnimationComplete?: () => void;
}

export const Branding: React.FC<BrandingProps> = ({
  config,
  onAnimationComplete
}) => {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
      onAnimationComplete?.();
    }, config.animationDuration);

    return () => clearTimeout(timer);
  }, [config.animationDuration, onAnimationComplete]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{
              background: theme === 'dark' ? '#111827' : '#ffffff'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <img
                src={config.logo}
                alt="Terrafusion Logo"
                className="w-32 h-32"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mt-4"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="flex justify-between items-center mb-8">
              <img
                src={config.logo}
                alt="Terrafusion"
                className="h-12"
              />
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-12"
            ><>

              <h1
                className={`text-4xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
                style={{ fontFamily: config.fontFamily }}
              >
                Welcome to Terrafusion
              </h1>
              <p
</>
                className={`text-xl ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {config.tagline}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  title: 'Advanced Analytics',
                  description: 'Powerful insights powered by AI'
                },
                {
                  title: 'Real-time Updates',
                  description: 'Live data processing and visualization'
                },
                {
                  title: 'Secure Platform',
                  description: 'Enterprise-grade security and compliance'
                }
              ].map((feature /* , index */) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className={`p-6 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}
                ><>

                  <h3
                    className={`text-xl font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
</>
                    className={`${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 