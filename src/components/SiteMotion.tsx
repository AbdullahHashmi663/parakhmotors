'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, type AnimationParams } from 'animejs';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type MotionRecord = {
  context: gsap.Context;
  entrance?: gsap.core.Tween;
  responsive?: gsap.MatchMedia;
};

/** Progressive enhancement: the server always renders visible, usable content. */
export function SiteMotion() {
  const pathname = usePathname();
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Immediately reset scroll position on route change so new page elements evaluate from top: 0
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const records = new Map<Element, MotionRecord>();
      const feedback = new Map<Element, ReturnType<typeof animate>>();
      let refreshTimer = 0;
      let accordionTimer = 0;
      let disposed = false;
      const isMobile = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches;

      const revertRecord = (record: MotionRecord) => {
        record.responsive?.revert();
        record.context.revert();
      };

      const refresh = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          if (!disposed) ScrollTrigger.refresh();
        }, 120);
      };

      const animateEntrance = (element: HTMLElement | SVGElement) => {
        if (disposed || !element.isConnected) return;
        const delay = parseFloat(element.dataset.motionDelay || '0');
        const kind = element.dataset.motionKind || 'reveal';

        const context = gsap.context(() => {
          if (kind === 'draw') {
            gsap.to(element, { opacity: 1, duration: 0.35, clearProps: 'opacity' });
            const paths = element.querySelectorAll<SVGGeometryElement>(
              'path:not([fill]), path[fill="none"], circle:not([fill])'
            );
            paths.forEach((path, index) => {
              const length = path.getTotalLength();
              gsap.fromTo(
                path,
                { strokeDasharray: length, strokeDashoffset: length },
                {
                  strokeDashoffset: 0,
                  duration: 1.15,
                  delay: delay + index * 0.055,
                  ease: 'power2.inOut',
                  clearProps: 'strokeDasharray,strokeDashoffset',
                }
              );
            });
          } else if (kind === 'image') {
            let responsive: gsap.MatchMedia | undefined;
            const entrance = gsap.fromTo(
              element,
              { opacity: 0, y: isMobile ? 18 : 24, scale: 0.98 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: isMobile ? 0.65 : 0.8,
                delay,
                ease: 'power2.out',
                clearProps: 'opacity,transform',
                force3D: true,
              }
            );

            const image = element.querySelector('img');
            if (image && !isMobile) {
              responsive = gsap.matchMedia();
              responsive.add('(min-width: 901px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
                gsap.fromTo(
                  image,
                  { yPercent: -3, scale: 1.08 },
                  {
                    yPercent: 3,
                    scale: 1.08,
                    ease: 'none',
                    scrollTrigger: {
                      trigger: element,
                      start: 'clamp(top bottom)',
                      end: 'clamp(bottom top)',
                      scrub: 0.8,
                    },
                  }
                );
              });
            }
            records.set(element, { context, entrance, responsive });
            return;
          } else {
            const distance = kind === 'heading' ? (isMobile ? 20 : 28) : kind === 'hero' ? 16 : (isMobile ? 14 : 20);
            const duration = kind === 'heading' ? (isMobile ? 0.65 : 0.75) : (isMobile ? 0.5 : 0.65);

            const entrance = gsap.fromTo(
              element,
              { opacity: 0, y: distance },
              {
                opacity: 1,
                y: 0,
                duration,
                delay,
                ease: 'power2.out',
                clearProps: 'opacity,transform',
                force3D: true,
              }
            );
            records.set(element, { context, entrance });
            return;
          }
        }, element);

        records.set(element, { context });
      };

      const entranceObserver = typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const target = entry.target as HTMLElement;
                  entranceObserver?.unobserve(target);

                  // If element was already scrolled past before observe, reveal immediately
                  if (entry.boundingClientRect.bottom < 0) {
                    gsap.set(target, { opacity: 1, clearProps: 'opacity,transform' });
                    records.set(target, { context: gsap.context(() => {}) });
                    return;
                  }

                  animateEntrance(target);
                }
              });
            },
            {
              rootMargin: '0px 0px -40px 0px',
              threshold: 0.05,
            }
          )
        : null;

      const reveal = (element: Element, kind: string, delay = 0, immediate = false) => {
        if (records.has(element) || !element.getClientRects().length) return;
        if (!(element instanceof HTMLElement || element instanceof SVGElement)) return;

        element.setAttribute('data-motion-delay', String(delay));
        element.setAttribute('data-motion-kind', kind);

        // Immediate elements (e.g. hero items) animate right away
        if (immediate || kind === 'hero') {
          animateEntrance(element);
          return;
        }

        // Check if already above current viewport
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0) {
          gsap.set(element, { opacity: 1, clearProps: 'opacity,transform' });
          records.set(element, { context: gsap.context(() => {}) });
          return;
        }

        // Set initial invisible state and observe for scroll entrance
        if (kind === 'draw') {
          gsap.set(element, { opacity: 0 });
        } else if (kind === 'image') {
          gsap.set(element, { opacity: 0, y: isMobile ? 18 : 24, scale: 0.98, force3D: true });
        } else {
          const distance = kind === 'heading' ? (isMobile ? 20 : 28) : (isMobile ? 14 : 20);
          gsap.set(element, { opacity: 0, y: distance, force3D: true });
        }

        if (entranceObserver) {
          entranceObserver.observe(element);
          records.set(element, { context: gsap.context(() => {}) });
        } else {
          animateEntrance(element);
        }
      };

      const discover = () => {
        if (disposed) return;

        // Clean up unmounted or removed elements
        for (const [element, record] of records) {
          if (!element.isConnected) {
            revertRecord(record);
            records.delete(element);
          }
        }

        // Find and register all motion elements across all pages
        document.querySelectorAll<HTMLElement>('[data-motion]').forEach((element) => {
          if (element.closest('dialog') || !element.isConnected || !element.getClientRects().length) return;

          const kind = element.dataset.motion;
          if (kind === 'stagger' || kind === 'hero') {
            const isHeroContainer = kind === 'hero';
            // Find all matching child items whose closest stagger container is this element
            const items = Array.from(element.querySelectorAll<HTMLElement>('[data-motion-item]')).filter(
              (item) => item.closest('[data-motion="stagger"], [data-motion="hero"]') === element
            );

            items.forEach((item, index) => {
              const itemDelay = Math.min(index * (isHeroContainer ? 0.08 : 0.06), 0.36);
              reveal(item, isHeroContainer ? 'hero' : 'reveal', itemDelay, isHeroContainer);
            });
          } else if (kind) {
            reveal(element, kind, 0, kind === 'hero');
          }
        });
      };

      const settleFocusedContent = (target: Element) => {
        for (const [element, record] of records) {
          if (element.contains(target) && record.entrance) {
            record.entrance.scrollTrigger?.kill();
            record.entrance.progress(1);
          }
        }
      };

      const playFeedback = (target: Element, options: AnimationParams) => {
        feedback.get(target)?.revert();
        const animation = animate(target, {
          ...options,
          onComplete: () => {
            animation.revert();
            if (feedback.get(target) === animation) feedback.delete(target);
          },
        });
        feedback.set(target, animation);
      };

      const press = (target: Element) => {
        settleFocusedContent(target);
        playFeedback(target, { scale: [{ to: 0.96, duration: 85 }, { to: 1, duration: 260 }], ease: 'out(3)' });
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || !(event.target instanceof Element)) return;
        const target = event.target.closest('[data-motion-press]');
        if (target && !target.matches(':disabled')) press(target);
      };

      const onClick = (event: MouseEvent) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('[data-motion-press]');
        if (event.detail === 0 && button && !button.matches(':disabled')) press(button);
        const heart = event.target.closest('[data-motion-feedback="heart"]')?.querySelector('svg');
        if (heart) {
          playFeedback(heart, {
            scale: [{ to: 1.35, duration: 140 }, { to: 1, duration: 350 }],
            rotate: [{ to: -12, duration: 140 }, { to: 0, duration: 350 }],
            ease: 'out(3)',
          });
        }
      };

      const onChange = (event: Event) => {
        if (!(event.target instanceof Element)) return;
        const choice = event.target.closest('[data-motion-feedback="choice"]');
        if (choice) {
          const target = choice.querySelector('div') || choice;
          settleFocusedContent(target);
          playFeedback(target, { scale: [{ to: 1.025, duration: 140 }, { to: 1, duration: 250 }], ease: 'out(3)' });
        }
      };

      const onToggle = (event: Event) => {
        const details = event.target;
        if (!(details instanceof HTMLDetailsElement) || details.dataset.motionFeedback !== 'accordion') return;
        if (details.open) {
          Array.from(details.children)
            .filter((child) => child.tagName !== 'SUMMARY')
            .forEach((body) => {
              playFeedback(body, { opacity: [0, 1], translateY: [-6, 0], duration: 300, ease: 'out(3)' });
            });
        }
        window.clearTimeout(accordionTimer);
        accordionTimer = window.setTimeout(refresh, 360);
      };

      const onFocus = (event: FocusEvent) => {
        if (event.target instanceof Element) settleFocusedContent(event.target);
      };

      const domObserver = new MutationObserver(() => {
        discover();
        if (!isMobile) refresh();
      });

      const onSceneReady = () => {
        discover();
        if (!isMobile) refresh();
      };

      const progressContext = gsap.context(() => {
        if (progress.current && !isMobile) {
          gsap.fromTo(
            progress.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
            }
          );
        }
      });

      // Schedule discovery across animation frames for complete DOM & layout readiness
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          discover();
          if (!isMobile) refresh();
        });
      });

      domObserver.observe(document.body, { childList: true, subtree: true });
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('toggle', onToggle, true);
      document.addEventListener('focusin', onFocus);
      document.addEventListener('load', refresh, true);
      document.addEventListener('parakh:motion-ready', onSceneReady);
      document.fonts.ready.then(() => {
        if (!disposed) {
          discover();
          refresh();
        }
      });

      return () => {
        disposed = true;
        entranceObserver?.disconnect();
        domObserver.disconnect();
        window.clearTimeout(refreshTimer);
        window.clearTimeout(accordionTimer);
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('click', onClick);
        document.removeEventListener('change', onChange);
        document.removeEventListener('toggle', onToggle, true);
        document.removeEventListener('focusin', onFocus);
        document.removeEventListener('load', refresh, true);
        document.removeEventListener('parakh:motion-ready', onSceneReady);
        feedback.forEach((animation) => animation.revert());
        records.forEach(revertRecord);
        progressContext.revert();
      };
    });

    return () => media.revert();
  }, [pathname]);

  return <div className="motion-progress" ref={progress} aria-hidden="true" />;
}
