"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number; // optional ms delay between sections
};

/**
 * FadeInSection
 * Wrap any block and it will fade + slide up when it enters viewport.
 */
export default function FadeInSection({ children, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
      <FadeInSection>
  <div className="flex justify-center gap-6 text-white/80 text-sm mt-20 mb-10">
    {/* tabs here */}
  </div>
</FadeInSection>
<FadeInSection delay={100}>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 mt-10">
    {/* three glass cards here */}
  </div>
</FadeInSection>

    </div>
  );
}
