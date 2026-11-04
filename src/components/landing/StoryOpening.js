"use client";

import { useEffect } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

export default function StoryOpening() {
  useEffect(() => {
    if (window.scrollY > 0) {
      return;
    }

    let transitionStarted = false;

    function handleScroll() {
      if (transitionStarted || window.scrollY < window.innerHeight * 0.2) {
        return;
      }

      const nextSection = document.getElementById("perubahan");
      if (!nextSection) {
        return;
      }

      transitionStarted = true;
      nextSection.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      aria-labelledby="opening-title"
      className="story-opening relative isolate flex items-end overflow-hidden bg-slate-950 text-white"
      id="darurat"
    >
      <div aria-hidden="true" className="story-opening__image" />
      <div aria-hidden="true" className="story-opening__overlay" />

      <div className="story-opening__content relative mx-auto flex w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-10">
        
        <h1
          className="opening-fade opening-fade--delayed mt-5 max-w-5xl text-4xl leading-[1.04] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
          id="opening-title"
        >
          KITA SEDANG MENGHADAPI
          <span className="block text-lime-200">DARURAT SAMPAH.</span>
        </h1>
        <p className="opening-fade opening-fade--later mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
          Setiap hari, sampah terus bertambah. Namun, sudahkah kita melakukan
          sesuatu?
        </p>

        <div className="opening-fade opening-fade--latest mt-9 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          
          <a
            className="group inline-flex items-center gap-3 text-sm font-medium text-white/75 transition hover:text-white"
            href="#perubahan"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-white/30 transition group-hover:border-white/70">
              <ArrowDown aria-hidden="true" className="size-4 animate-bounce" />
            </span>
            Gulir untuk melanjutkan
          </a>
        </div>
      </div>
      
    </section>
  );
}
