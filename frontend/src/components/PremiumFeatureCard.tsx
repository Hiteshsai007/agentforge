import { type ReactNode } from 'react';

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  features?: string[];
  image?: string;
  sizeLarge?: boolean;
  gradient?: 'blue' | 'purple' | 'emerald' | 'amber' | 'gray';
  onClick?: () => void;
}

export default function PremiumFeatureCard({
  icon,
  title,
  description,
  features,
  image,
  sizeLarge = false,
  gradient = 'gray',
  onClick,
}: FeatureCardProps) {
  const gradientColors = {
    blue: 'from-blue-600/20 to-blue-400/10',
    purple: 'from-purple-600/20 to-purple-400/10',
    emerald: 'from-emerald-600/20 to-emerald-400/10',
    amber: 'from-amber-600/20 to-amber-400/10',
    gray: 'from-white/10 to-white/5',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur transition-all duration-500 cursor-pointer ${
        sizeLarge ? 'md:col-span-2 md:row-span-2' : ''
      } ${onClick ? 'hover:border-white/30 hover:shadow-2xl hover:shadow-white/10' : ''}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[gradient]}`} />

      {/* Image Background */}
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        </div>
      )}

      {/* Animated Border Glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur" />

      {/* Content */}
      <div className="relative p-6 md:p-8 h-full flex flex-col justify-between z-10">
        {/* Icon */}
        {icon && (
          <div className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}

        {/* Title */}
        <div className="mb-auto">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
            {description}
          </p>

          {/* Features List */}
          {features && features.length > 0 && (
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li
                  key={idx}
                  className="text-xs md:text-sm text-gray-400 flex items-start gap-2"
                >
                  <span className="text-white font-bold">→</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom Accent */}
        <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Learn More
          </span>
          <svg
            className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
