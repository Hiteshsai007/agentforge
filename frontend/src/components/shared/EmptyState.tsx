

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'premium';
}

export default function EmptyState({ 
  icon = '📭', 
  title, 
  description,
  action,
  variant = 'premium'
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="py-12 px-4 text-center">
        <p className="text-gray-400">{title}</p>
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <span className="text-5xl mb-4">{icon}</span>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        {description && <p className="text-gray-400 mb-6 max-w-md">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // Premium variant
  return (
    <div className="card p-12 text-center animate-in fade-in duration-500">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-6">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      {description && <p className="text-gray-400 mb-8 max-w-md mx-auto">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
