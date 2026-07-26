"use client";

import { motion } from "motion/react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

type ProofLogo = { name: string; mark?: string };
type LogoProofGridProps = { logos: ProofLogo[]; className?: string; label?: string };

export function LogoProofGrid({ logos, className, label = "Trusted by teams at" }: LogoProofGridProps) {
  const reduceMotion = useHydratedReducedMotion();
  return <div className={`oui-logo-proof ${className ?? ""}`}><span>{label}</span><div>{logos.map((logo, index) => <motion.div key={logo.name} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.4 }}><b aria-hidden="true">{logo.mark ?? logo.name.slice(0, 1)}</b><strong>{logo.name}</strong></motion.div>)}</div></div>;
}
