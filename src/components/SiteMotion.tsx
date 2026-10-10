'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, type AnimationParams } from 'animejs';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type MotionRecord = { context: gsap.Context; entrance?: gsap.core.Tween; responsive?: gsap.MatchMedia };

/** Progressive enhancement: the server always renders visible, usable content. */
export function SiteMotion() {
  const pathname = usePathname();
  const progress = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const records = new Map<Element, MotionRecord>();
      const feedback = new Map<Element, ReturnType<typeof animate>>();
      let refreshTimer: number = 0;
      let accordionTimer = 0;
      let disposed = false;
      const isMobile = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches;
      const readyScene = (element: Element) => element.closest('[data-motion-scene][data-motion-ready="true"]');
      const revertRecord = (record: MotionRecord) => { record.responsive?.revert(); record.context.revert(); };

      const refresh = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          if (!disposed) ScrollTrigger.refresh();
        }, 120);
      };

      let mobileObserver: IntersectionObserver | null = null;
      if (isMobile && typeof IntersectionObserver !== 'undefined') {
        mobileObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              mobileObserver?.unobserve(target);
              const delay = parseFloat(target.dataset.motionDelay || '0');
              const kind = target.dataset.motionKind || 'reveal';
              gsap.fromTo(target,
                { opacity: 0, y: kind === 'heading' ? 22 : 16 },
                {
                  opacity: 1,
                  y: 0,
                  duration: kind === 'heading' ? 0.65 : 0.5,
                  delay,
                  ease: 'power2.out',
                  clearProps: 'opacity,transform',
                  force3D: true,
                }
              );
            }
          });
        }, {
          rootMargin: '0px 0px -6% 0px',
          threshold: 0.05,
        });
      }

      const reveal = (element: Element, kind: string, delay = 0, immediate = false) => {
        if (records.has(element) || !element.getClientRects().length) return;
        if (isMobile) {
          const aboveViewport = element.getBoundingClientRect().bottom < 0;
          if (aboveViewport || immediate || kind === 'hero') {
            const context = gsap.context(() => {
              const entrance = gsap.fromTo(element,
                { opacity: 0, y: 14 },
                {
                  opacity: 1, y: 0, duration: 0.55, delay,
                  ease: 'power2.out', clearProps: 'opacity,transform', force3D: true,
                }
              );
              records.set(element, { context, entrance });
            }, element);
          } else if (mobileObserver && element instanceof HTMLElement) {
            element.dataset.motionDelay = String(delay);
            element.dataset.motionKind = kind;
            gsap.set(element, { opacity: 0, y: kind === 'heading' ? 22 : 16, force3D: true });
            mobileObserver.observe(element);
            records.set(element, { context: gsap.context(() => {}) });
          }
          return;
        }
        // An already-scrolled-to destination should become readable immediately.
        const aboveViewport = element.getBoundingClientRect().bottom < 0;
        let entrance: gsap.core.Tween | undefined;
        let responsive: gsap.MatchMedia | undefined;
        const context = gsap.context(() => {
          const trigger = immediate || aboveViewport ? undefined : {
            trigger: element,
            start: 'clamp(top 91%)',
            once: true,
            fastScrollEnd: true,
            toggleActions: 'play none none none',
          };

          if (kind === 'draw') {
            const paths = element.querySelectorAll<SVGGeometryElement>('path:not([fill]), path[fill="none"], circle:not([fill])');
            paths.forEach((path, index) => {
              const length = path.getTotalLength();
              gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, {
                strokeDashoffset: 0, duration: 1.25, delay: index * 0.065,
                ease: 'power2.inOut', scrollTrigger: trigger,
                clearProps: 'strokeDasharray,strokeDashoffset',
              });
            });
          } else if (kind === 'image') {
            if (isMobile) {
              entrance = gsap.fromTo(element,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.65, delay, ease: 'power2.out', scrollTrigger: trigger, clearProps: 'opacity,transform', force3D: true });
            } else {
              entrance = gsap.fromTo(element,
                { opacity: 0, clipPath: 'inset(0% 0% 18% 0% round 6px)' },
                { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 6px)',
                  duration: 1.05, delay, ease: 'power3.out', scrollTrigger: trigger,
                  clearProps: 'opacity,clipPath', force3D: true });
            }
            const image = element.querySelector('img');
            if (image) {
              responsive = gsap.matchMedia();
              responsive.add('(min-width: 901px) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
                gsap.fromTo(image, { yPercent: -3, scale: 1.09 }, {
                  yPercent: 3, scale: 1.09, ease: 'none',
                  scrollTrigger: { trigger: element, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: 0.8 },
                });
              });
            }
          } else {
            entrance = gsap.from(element, {
              opacity: 0, y: kind === 'heading' ? (isMobile ? 18 : 30) : (isMobile ? 14 : 22),
              duration: kind === 'heading' ? (isMobile ? 0.6 : 0.9) : (isMobile ? 0.5 : 0.72),
              delay: aboveViewport ? 0 : delay,
              ease: 'power3.out', scrollTrigger: trigger,
              clearProps: 'opacity,transform',
              force3D: true,
            });
          }
        }, element);
        records.set(element, { context, entrance, responsive });
        if (aboveViewport) entrance?.progress(1);
      };

      const discover = () => {
        // Inventory filters and streamed route content can introduce new nodes.
        for (const [element, record] of records) {
          if (!element.isConnected || !readyScene(element)) { revertRecord(record); records.delete(element); }
        }
        document.querySelectorAll<HTMLElement>('[data-motion]').forEach(element => {
          if (!readyScene(element) || element.closest('dialog') || !element.getClientRects().length) return;
          const kind = element.dataset.motion;
          if (kind === 'stagger' || kind === 'hero') {
            const items = element.querySelectorAll(':scope > [data-motion-item]');
            items.forEach((item, index) => reveal(item, 'reveal', Math.min(index * (kind === 'hero' ? 0.09 : 0.065), 0.3), kind === 'hero'));
          } else if (kind) reveal(element, kind);
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
        if (!readyScene(event.target)) return;
        const target = event.target.closest('[data-motion-press]');
        if (target && !target.matches(':disabled')) press(target);
      };
      const onClick = (event: MouseEvent) => {
        if (!(event.target instanceof Element)) return;
        if (!readyScene(event.target)) return;
        const button = event.target.closest('[data-motion-press]');
        if (event.detail === 0 && button && !button.matches(':disabled')) press(button);
        const heart = event.target.closest('[data-motion-feedback="heart"]')?.querySelector('svg');
        if (heart) playFeedback(heart, {
          scale: [{ to: 1.35, duration: 140 }, { to: 1, duration: 350 }],
          rotate: [{ to: -12, duration: 140 }, { to: 0, duration: 350 }], ease: 'out(3)',
        });
      };
      const onChange = (event: Event) => {
        if (!(event.target instanceof Element)) return;
        if (!readyScene(event.target)) return;
        const choice = event.target.closest('[data-motion-feedback="choice"]');
        if (choice) {
          const target = choice.querySelector('div') || choice;
          settleFocusedContent(target);
          playFeedback(target, { scale: [{ to: 1.025, duration: 140 }, { to: 1, duration: 250 }], ease: 'out(3)' });
        }
      };
      const onToggle = (event: Event) => {
        const details = event.target;
        if (!(details instanceof HTMLDetailsElement) || !readyScene(details) || details.dataset.motionFeedback !== 'accordion') return;
        if (details.open) {
          Array.from(details.children).filter(child => child.tagName !== 'SUMMARY').forEach(body => {
            playFeedback(body, { opacity: [0, 1], translateY: [-6, 0], duration: 300, ease: 'out(3)' });
          });
        }
        window.clearTimeout(accordionTimer);
        accordionTimer = window.setTimeout(refresh, 360);
      };
      const onFocus = (event: FocusEvent) => {
        if (event.target instanceof Element) settleFocusedContent(event.target);
      };
      const observer = new MutationObserver(() => { discover(); refresh(); });
      const onSceneReady = () => { discover(); refresh(); };

      const progressContext = gsap.context(() => {
        if (progress.current && !isMobile) gsap.fromTo(progress.current, { scaleX: 0 }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
        });
      });
      discover();
      if (!isMobile) observer.observe(document.body, { childList: true, subtree: true });
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('toggle', onToggle, true);
      document.addEventListener('focusin', onFocus);
      document.addEventListener('load', refresh, true);
      document.addEventListener('parakh:motion-ready', onSceneReady);
      document.fonts.ready.then(() => { if (!disposed) refresh(); });
      refresh();

      return () => {
        disposed = true;
        mobileObserver?.disconnect();
        observer.disconnect();
        window.clearTimeout(refreshTimer);
        window.clearTimeout(accordionTimer);
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('click', onClick);
        document.removeEventListener('change', onChange);
        document.removeEventListener('toggle', onToggle, true);
        document.removeEventListener('focusin', onFocus);
        document.removeEventListener('load', refresh, true);
        document.removeEventListener('parakh:motion-ready', onSceneReady);
        feedback.forEach(animation => animation.revert());
        records.forEach(revertRecord);
        progressContext.revert();
      };
    });
    return () => media.revert();
  }, [pathname]);

  return <div className="motion-progress" ref={progress} aria-hidden="true" />;
}
