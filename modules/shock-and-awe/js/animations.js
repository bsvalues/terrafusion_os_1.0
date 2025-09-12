/**
 * Terrafusion Market - Advanced Animations Engine
 * Quantum-Inspired Visual Effects and Interactions
 * Squad Alpha Component - Advanced Animations
 */

class TerraFusionAnimations {
    constructor() {
        this.observers = new Map();
        this.runningAnimations = new Set();
        this.rafId = null;
        this.scrollPosition = 0;
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    init() {
        this.initializeIntersectionObserver();
        this.initializeScrollAnimations();
        this.initializeHoverEffects();
        this.initializeLoadingAnimations();
        this.setupAnimationFrame();
        this.initializeQuantumParticles();
    }

    /**
     * Initialize Intersection Observer for scroll-triggered animations
     */
    initializeIntersectionObserver() {
        const observerOptions = {
            threshold: [0, 0.1, 0.5, 0.8, 1.0],
            rootMargin: '-50px 0px -50px 0px'
        };

        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const animationType = element.dataset.aos || 'fade-up';
                
                if (entry.isIntersecting) {
                    this.triggerAnimation(element, animationType);
                }
            });
        }, observerOptions);

        // Observe all elements with data-aos attribute
        document.querySelectorAll('[data-aos]').forEach(element => {
            this.scrollObserver.observe(element);
        });
    }

    /**
     * Initialize scroll-based animations
     */
    initializeScrollAnimations() {
        let ticking = false;

        const updateScrollPosition = () => {
            this.scrollPosition = window.pageYOffset;
            this.updateParallaxElements();
            this.updateProgressBars();
            this.updateCounterAnimations();
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        });
    }

    /**
     * Initialize hover effects
     */
    initializeHoverEffects() {
        // Card hover effects
        document.querySelectorAll('.feature-card, .pricing-card, .result-card').forEach(card => {
            this.addCardHoverEffect(card);
        });

        // Button hover effects
        document.querySelectorAll('.btn').forEach(button => {
            this.addButtonHoverEffect(button);
        });

        // Logo hover effect
        const logo = document.querySelector('.logo');
        if (logo) {
            this.addLogoHoverEffect(logo);
        }
    }

    /**
     * Initialize loading animations
     */
    initializeLoadingAnimations() {
        // Animate elements on page load
        window.addEventListener('load', () => {
            this.animatePageLoad();
        });

        // Staggered animation for grids
        this.initializeStaggeredAnimations();
    }

    /**
     * Setup animation frame loop
     */
    setupAnimationFrame() {
        const animate = (timestamp) => {
            this.updateAnimations(timestamp);
            this.rafId = requestAnimationFrame(animate);
        };
        
        this.rafId = requestAnimationFrame(animate);
    }

    /**
     * Trigger animation based on type
     */
    triggerAnimation(element, type) {
        if (this.isReducedMotion) {
            element.classList.add('aos-animate');
            return;
        }

        const delay = parseInt(element.dataset.aosDelay) || 0;
        
        setTimeout(() => {
            switch (type) {
                case 'fade-up':
                    this.fadeUpAnimation(element);
                    break;
                case 'fade-down':
                    this.fadeDownAnimation(element);
                    break;
                case 'fade-left':
                    this.fadeLeftAnimation(element);
                    break;
                case 'fade-right':
                    this.fadeRightAnimation(element);
                    break;
                case 'zoom-in':
                    this.zoomInAnimation(element);
                    break;
                case 'flip-up':
                    this.flipUpAnimation(element);
                    break;
                case 'slide-up':
                    this.slideUpAnimation(element);
                    break;
                default:
                    this.fadeUpAnimation(element);
            }
        }, delay);
    }

    /**
     * Animation implementations
     */
    fadeUpAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            element.classList.add('aos-animate');
        });
    }

    fadeDownAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            element.classList.add('aos-animate');
        });
    }

    fadeLeftAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
            element.classList.add('aos-animate');
        });
    }

    fadeRightAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
            element.classList.add('aos-animate');
        });
    }

    zoomInAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
            element.classList.add('aos-animate');
        });
    }

    flipUpAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'perspective(2500px) rotateX(-100deg)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'perspective(2500px) rotateX(0deg)';
            element.classList.add('aos-animate');
        });
    }

    slideUpAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(100%)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            element.classList.add('aos-animate');
        });
    }

    /**
     * Card hover effects
     */
    addCardHoverEffect(card) {
        if (this.isReducedMotion) return;

        const handleMouseEnter = () => {
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
        };

        const handleMouseLeave = () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        };

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
    }

    /**
     * Button hover effects
     */
    addButtonHoverEffect(button) {
        if (this.isReducedMotion) return;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);

        button.addEventListener('click', (e) => {
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('animate');
            
            setTimeout(() => {
                ripple.classList.remove('animate');
            }, 600);
        });
    }

    /**
     * Logo hover effect
     */
    addLogoHoverEffect(logo) {
        if (this.isReducedMotion) return;

        const handleMouseEnter = () => {
            logo.style.transition = 'transform 0.3s ease';
            logo.style.transform = 'rotate(5deg) scale(1.1)';
        };

        const handleMouseLeave = () => {
            logo.style.transform = 'rotate(0deg) scale(1)';
        };

        logo.addEventListener('mouseenter', handleMouseEnter);
        logo.addEventListener('mouseleave', handleMouseLeave);
    }

    /**
     * Page load animations
     */
    animatePageLoad() {
        // Hide loading screen with animation
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.5s ease';
            loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        // Animate navbar
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.transform = 'translateY(-100%)';
            navbar.style.transition = 'transform 0.6s ease';
            
            setTimeout(() => {
                navbar.style.transform = 'translateY(0)';
            }, 200);
        }

        // Animate hero content
        this.animateHeroContent();
    }

    /**
     * Hero content animation
     */
    animateHeroContent() {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroActions = document.querySelector('.hero-actions');
        const heroStats = document.querySelector('.hero-stats');

        if (heroTitle) {
            heroTitle.style.opacity = '0';
            heroTitle.style.transform = 'translateY(30px)';
            heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            setTimeout(() => {
                heroTitle.style.opacity = '1';
                heroTitle.style.transform = 'translateY(0)';
            }, 400);
        }

        if (heroSubtitle) {
            heroSubtitle.style.opacity = '0';
            heroSubtitle.style.transform = 'translateY(30px)';
            heroSubtitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            setTimeout(() => {
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            }, 600);
        }

        if (heroActions) {
            heroActions.style.opacity = '0';
            heroActions.style.transform = 'translateY(30px)';
            heroActions.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            setTimeout(() => {
                heroActions.style.opacity = '1';
                heroActions.style.transform = 'translateY(0)';
            }, 800);
        }

        if (heroStats) {
            this.animateStatsCounter(heroStats);
        }
    }

    /**
     * Staggered animations for grids
     */
    initializeStaggeredAnimations() {
        document.querySelectorAll('.features-grid, .pricing-grid').forEach(grid => {
            const items = grid.children;
            
            Array.from(items).forEach((item /* , index */) => {
                if (!item.dataset.aos) {
                    item.dataset.aos = 'fade-up';
                    item.dataset.aosDelay = (index * 100).toString();
                }
            });
        });
    }

    /**
     * Counter animations
     */
    animateStatsCounter(statsContainer) {
        const stats = statsContainer.querySelectorAll('.stat-number');
        
        stats.forEach(stat => {
            const targetText = stat.textContent;
            const targetNumber = parseFloat(targetText.replace(/[^0-9.]/g, ''));
            const suffix = targetText.replace(/[0-9.]/g, '');
            
            this.animateCounter(stat, 0, targetNumber, 2000, suffix);
        });
    }

    animateCounter(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (end - start) * easeOutQuart;
            
            element.textContent = this.formatCounterValue(current) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = this.formatCounterValue(end) + suffix;
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    formatCounterValue(value) {
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        } else if (value >= 100) {
            return Math.round(value);
        } else {
            return value.toFixed(1);
        }
    }

    /**
     * Parallax effects
     */
    updateParallaxElements() {
        document.querySelectorAll('[data-parallax]').forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(this.scrollPosition * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    /**
     * Progress bar animations
     */
    updateProgressBars() {
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const rect = bar.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight && rect.bottom > 0) {
                const progress = bar.dataset.progress || '0';
                const fill = bar.querySelector('.progress-fill');
                
                if (fill && !fill.classList.contains('animated')) {
                    fill.style.width = progress + '%';
                    fill.classList.add('animated');
                }
            }
        });
    }

    updateCounterAnimations() {
        document.querySelectorAll('[data-counter]').forEach(counter => {
            const rect = counter.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (rect.top < windowHeight && rect.bottom > 0 && !counter.classList.contains('counted')) {
                const target = parseInt(counter.dataset.counter);
                this.animateCounter(counter, 0, target, 2000);
                counter.classList.add('counted');
            }
        });
    }

    /**
     * Quantum particle initialization
     */
    initializeQuantumParticles() {
        const quantumContainers = document.querySelectorAll('.quantum-visualization');
        
        quantumContainers.forEach(container => {
            this.createQuantumParticles(container);
        });
    }

    createQuantumParticles(container) {
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('quantum-particle');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: radial-gradient(circle, #68d391, #38b2ac);
                border-radius: 50%;
                pointer-events: none;
                opacity: ${Math.random() * 0.8 + 0.2};
            `;
            
            particles.push({
                element: particle,
                x: Math.random() * container.offsetWidth,
                y: Math.random() * container.offsetHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random() * 1000 + 500
            });
            
            container.appendChild(particle);
        }
        
        this.animateQuantumParticles(container, particles);
    }

    animateQuantumParticles(container, particles) {
        const animate = () => {
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                
                // Bounce off edges
                if (particle.x <= 0 || particle.x >= container.offsetWidth) {
                    particle.vx *= -1;
                }
                if (particle.y <= 0 || particle.y >= container.offsetHeight) {
                    particle.vy *= -1;
                }
                
                // Update position
                particle.element.style.left = particle.x + 'px';
                particle.element.style.top = particle.y + 'px';
                
                // Fade out over time
                const opacity = particle.life / 1000;
                particle.element.style.opacity = Math.max(0, opacity);
                
                // Reset particle when life ends
                if (particle.life <= 0) {
                    particle.x = Math.random() * container.offsetWidth;
                    particle.y = Math.random() * container.offsetHeight;
                    particle.vx = (Math.random() - 0.5) * 2;
                    particle.vy = (Math.random() - 0.5) * 2;
                    particle.life = Math.random() * 1000 + 500;
                }
            });
            
            if (!this.isReducedMotion) {
                requestAnimationFrame(animate);
            }
        };
        
        if (!this.isReducedMotion) {
            animate();
        }
    }

    /**
     * Update all animations
     */
    updateAnimations(timestamp) {
        // Update any time-based animations here
        this.updateFloatingElements(timestamp);
        this.updateGlowEffects(timestamp);
    }

    updateFloatingElements(timestamp) {
        document.querySelectorAll('.floating-element').forEach((element /* , index */) => {
            const speed = 0.001 + (index * 0.0002);
            const amplitude = 10 + (index * 2);
            const offset = index * Math.PI / 4;
            
            const y = Math.sin(timestamp * speed + offset) * amplitude;
            element.style.transform = `translateY(${y}px)`;
        });
    }

    updateGlowEffects(timestamp) {
        document.querySelectorAll('.glow-effect').forEach((element /* , index */) => {
            const speed = 0.002 + (index * 0.0003);
            const intensity = 0.5 + Math.sin(timestamp * speed) * 0.3;
            
            element.style.filter = `drop-shadow(0 0 20px rgba(104, 211, 145, ${intensity}))`;
        });
    }

    /**
     * Morphing text animation
     */
    morphText(element, texts, duration = 3000) {
        let currentIndex = 0;
        
        const morph = () => {
            const currentText = texts[currentIndex];
            const nextText = texts[(currentIndex + 1) % texts.length];
            
            // Animate text morphing
            element.textContent = currentText;
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100);
            
            currentIndex = (currentIndex + 1) % texts.length;
        };
        
        morph();
        setInterval(morph, duration);
    }

    /**
     * Cleanup animations
     */
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
        
        this.runningAnimations.clear();
        this.observers.clear();
    }

    /**
     * Public API methods
     */
    startAnimation(element, type, options = {}) {
        this.triggerAnimation(element, type);
    }

    pauseAnimations() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    resumeAnimations() {
        if (!this.rafId) {
            this.setupAnimationFrame();
        }
    }

    setReducedMotion(enabled) {
        this.isReducedMotion = enabled;
        
        if (enabled) {
            this.pauseAnimations();
            // Add reduced motion styles
            document.body.classList.add('reduced-motion');
        } else {
            this.resumeAnimations();
            document.body.classList.remove('reduced-motion');
        }
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terrafusionAnimations = new TerraFusionAnimations();
});

// Handle visibility change to pause/resume animations
document.addEventListener('visibilitychange', () => {
    if (window.terrafusionAnimations) {
        if (document.hidden) {
            window.terrafusionAnimations.pauseAnimations();
        } else {
            window.terrafusionAnimations.resumeAnimations();
        }
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerraFusionAnimations;
}