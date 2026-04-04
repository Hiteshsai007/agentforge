interface HeroProps {
  title: string;
  subtitle?: string;
  cta?: { label: string; action: () => void };
  secondaryCta?: { label: string; action: () => void };
  backgroundImage?: string;
}

export default function PremiumHero({
  title,
  subtitle,
  cta,
  secondaryCta,
  backgroundImage,
}: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Elements */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      )}

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-10 animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Pre-Title Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur hover:bg-white/10 transition-colors">
          <span className="w-2 h-2 bg-white rounded-full" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
            Welcome to AgentForge
          </span>
        </div>

        {/* Main Title - Dramatic Typography */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-tight">
          <span className="text-white">{title.split(' ')[0]}</span>
          {title.split(' ').length > 1 && (
            <>
              <br />
              <span className="text-gradient">{title.split(' ').slice(1).join(' ')}</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
          {cta && (
            <button
              onClick={cta.action}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-full transition-all hover:shadow-2xl hover:shadow-white/20"
            >
              <span className="relative z-10">{cta.label}</span>
              <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
          )}

          {secondaryCta && (
            <button
              onClick={secondaryCta.action}
              className="btn text-white"
            >
              {secondaryCta.label}
            </button>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll to explore</span>
          <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
