"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function RecommendationSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6"
    >
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">{children}</div>
    </motion.section>
  );
}
