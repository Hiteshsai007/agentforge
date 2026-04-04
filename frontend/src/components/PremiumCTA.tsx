interface PremiumCTAProps {
  title: string;
  subtitle?: string;
  primaryCta: { label: string; action: () => void };
  secondaryCta?: { label: string; action: () => void };
  backgroundImage?: string;
}

export default function PremiumCTA({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  backgroundImage,
}: PremiumCTAProps) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      )}

      {/* Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Title */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-tight text-white">
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <button
            onClick={primaryCta.action}
            className="group relative inline-flex items-center justify-center px-10 py-4 bg-white text-black font-semibold rounded-full transition-all hover:shadow-2xl hover:shadow-white/30 md:px-12 md:py-5"
          >
            <span className="relative z-10 text-lg">{primaryCta.label}</span>
            <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>

          {secondaryCta && (
            <button
              onClick={secondaryCta.action}
              className="btn text-lg px-10 py-4 md:px-12 md:py-5"
            >
              {secondaryCta.label}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
