"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  title: string;
  description?: string;
}

interface StoreBannerProps {
  banners: Banner[];
  onBannerChange?: (index: number) => void;
}

export function StoreBanner({ banners, onBannerChange }: StoreBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!banners || banners.length === 0) {
    return null;
  }

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onBannerChange?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % banners.length;
    setCurrentIndex(newIndex);
    onBannerChange?.(newIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    onBannerChange?.(index);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500 to-primary-600 shadow-md">
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        {banners[currentIndex].image_url ? (
          <Image
            src={banners[currentIndex].image_url}
            alt={banners[currentIndex].title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200">
            <span className="text-slate-400">صورة العرض</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-start justify-center p-4 text-white sm:p-6">
          <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">
            {banners[currentIndex].title}
          </h2>
          {banners[currentIndex].description && (
            <p className="mt-2 text-sm sm:text-base text-white/90">
              {banners[currentIndex].description}
            </p>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 backdrop-blur transition hover:bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 backdrop-blur transition hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
