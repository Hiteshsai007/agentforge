interface StatItem {
  number: string | number;
  label: string;
  description?: string;
  trend?: { value: number; isPositive: boolean };
}

interface PremiumStatsProps {
  stats: StatItem[];
  className?: string;
}

export default function PremiumStats({ stats, className = '' }: PremiumStatsProps) {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            By The Numbers
          </h2>
          <p className="text-gray-400 text-lg">
            Our platform powers intelligent AI automation at scale
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group relative"
              style={{
                animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`,
              }}
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl" />

              {/* Hover Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg" />

              {/* Content */}
              <div className="relative p-8 space-y-4">
                {/* Number */}
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black text-white">
                    {stat.number}
                  </span>
                  {stat.trend && (
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        stat.trend.isPositive
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-red-400 bg-red-500/10'
                      }`}
                    >
                      {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%
                    </span>
                  )}
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                  {stat.label}
                </h3>

                {/* Description */}
                {stat.description && (
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {stat.description}
                  </p>
                )}

                {/* Bottom Accent */}
                <div className="pt-4 flex gap-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-white to-white/30 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
