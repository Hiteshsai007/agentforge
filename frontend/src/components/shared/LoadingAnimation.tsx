

interface LoadingAnimationProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingAnimation({ 
  variant = 'spinner', 
  size = 'md',
  message = 'Loading...'
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        {message && <p className="text-gray-400 text-sm">{message}</p>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse opacity-60`} />
        {message && <p className="text-gray-400 text-sm">{message}</p>}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1 items-end h-12">
          <div className="w-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-full animate-[grow_0.8s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0s' }} />
          <div className="w-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-full animate-[grow_0.8s_ease-in-out_infinite]" style={{ height: '70%', animationDelay: '0.1s' }} />
          <div className="w-1 bg-gradient-to-t from-pink-500 to-pink-400 rounded-full animate-[grow_0.8s_ease-in-out_infinite]" style={{ height: '50%', animationDelay: '0.2s' }} />
          <div className="w-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-full animate-[grow_0.8s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '0.3s' }} />
        </div>
        {message && <p className="text-gray-400 text-sm">{message}</p>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-white/20 border-t-white animate-spin`} />
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );
}
