import { useState } from 'react';
import PremiumLayout from '../components/PremiumLayout';

interface DocSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  subsections: {
    title: string;
    content: string;
    code?: string;
    language?: string;
  }[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Start building agents in minutes',
    subsections: [
      {
        title: 'What is AgentForge?',
        content: 'AgentForge is a marketplace platform where developers can create, publish, and monetize AI agents. Agents are intelligent programs that perform specific tasks using large language models.'
      },
      {
        title: 'Quick Setup',
        content: 'To get started, create an account on AgentForge, register as a developer, and publish your first agent. Once published, companies can discover and use your agent.'
      },
      {
        title: 'Agent Structure',
        content: 'An agent consists of a name, description, capabilities, version, and HTTP endpoints. Your agent should expose a simple interface that accepts requests and returns results.',
        code: `{
  "agent_id": "unique-identifier",
  "agent_name": "Your Agent Name",
  "description": "What your agent does",
  "version": "1.0.0",
  "capabilities": ["capability1", "capability2"],
  "endpoint": "https://your-api.com/execute"
}`,
        language: 'json'
      }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: '📚',
    description: 'Complete endpoint documentation',
    subsections: [
      {
        title: 'Execute Agent',
        content: 'Execute an agent by sending a request to its endpoint',
        code: `POST /execute

Request:
{
  "agent_id": "your-agent-id",
  "input": "user input",
  "params": { ... }
}

Response:
{
  "status": "success",
  "result": "agent output",
  "execution_time": 1234
}`,
        language: 'bash'
      },
      {
        title: 'Register Agent',
        content: 'Register your agent on the marketplace',
        code: `POST /api/agents/register

Headers:
Authorization: Bearer YOUR_API_KEY

Body:
{
  "agent_name": "Agent Name",
  "description": "Description",
  "endpoint": "https://your-api.com/execute",
  "capabilities": ["cap1", "cap2"]
}`,
        language: 'bash'
      },
      {
        title: 'Update Agent',
        content: 'Update your agent details or version',
        code: `PUT /api/agents/{agent_id}

Headers:
Authorization: Bearer YOUR_API_KEY

Body:
{
  "version": "1.1.0",
  "description": "Updated description",
  "capabilities": ["cap1", "cap2", "cap3"]
}`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: '✨',
    description: 'Optimize your agents for success',
    subsections: [
      {
        title: 'Performance',
        content: 'Keep your agent response time under 5 seconds. Implement caching and optimize API calls to third-party services.'
      },
      {
        title: 'Reliability',
        content: 'Implement proper error handling and return meaningful error messages. Use health checks and monitoring to ensure your agent is always available.'
      },
      {
        title: 'Security',
        content: 'Validate all inputs, use HTTPS for all endpoints, implement rate limiting, and never expose sensitive information in responses.'
      },
      {
        title: 'Quality',
        content: 'Write clear descriptions, test thoroughly, monitor user feedback, and continuously improve your agent based on execution data.'
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing & Revenue',
    icon: '💰',
    description: 'Understand the revenue model',
    subsections: [
      {
        title: 'How It Works',
        content: 'For every successful execution of your agent, you earn revenue. The amount varies based on execution complexity, compute usage, and your pricing tier.'
      },
      {
        title: 'Payment',
        content: 'Payouts are processed monthly. You can view detailed analytics of your agent usage, revenue, and growth metrics in your developer portal.'
      },
      {
        title: 'Revenue Optimization',
        content: 'Focus on building high-quality, reliable agents with clear value propositions. Market your agents, gather user feedback, and continuously improve based on metrics.'
      }
    ]
  },
  {
    id: 'examples',
    title: 'Code Examples',
    icon: '💡',
    description: 'Sample implementations',
    subsections: [
      {
        title: 'Simple Text Agent',
        content: 'A basic agent that processes text',
        code: `import requests

def execute_agent(input_text):
    from google import generativeai as genai
    
    genai.configure(api_key="YOUR_API_KEY")
    model = genai.GenerativeModel("gemini-pro")
    
    response = model.generate_content(input_text)
    return response.text

# Expose via API endpoint
from fastapi import FastAPI
app = FastAPI()

@app.post("/execute")
async def agent_endpoint(request: dict):
    result = execute_agent(request["input"])
    return {"status": "success", "result": result}`,
        language: 'python'
      },
      {
        title: 'Agent with Context',
        content: 'An agent that maintains context across multiple requests',
        code: `const executeAgent = async (input, context = {}) => {
  const response = await fetch('https://api.example.com/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      input,
      context,
      params: { temperature: 0.7 }
    })
  });
  
  return response.json();
};`,
        language: 'javascript'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    description: 'Solve common issues',
    subsections: [
      {
        title: 'Agent Not Responding',
        content: 'Check your endpoint is publicly accessible, verify API key is correct, ensure your server is running, and check firewall/security settings.'
      },
      {
        title: 'Execution Errors',
        content: 'Review the error message, check input format, verify API credentials, and test with a simple curl request to debug.'
      },
      {
        title: 'Low Usage',
        content: 'Improve your agent description, add more capabilities, optimize performance, and engage with user feedback.'
      },
      {
        title: 'Rate Limiting',
        content: 'If you exceed rate limits, implement exponential backoff, use caching, or contact support for higher limits.'
      }
    ]
  }
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);

  const currentSection = DOC_SECTIONS.find(s => s.id === activeSection);

  return (
    <PremiumLayout navProps={{}}>
      <div className="page-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-4 mb-4">Documentation</h3>
              {DOC_SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium ${
                    activeSection === section.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {currentSection && (
              <>
                {/* Header */}
                <div className="space-y-4">
                  <div className="text-5xl">{currentSection.icon}</div>
                  <div>
                    <h1 className="text-4xl font-black text-white mb-2">{currentSection.title}</h1>
                    <p className="text-lg text-gray-400">{currentSection.description}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-indigo-500/20 via-white/10 to-transparent" />

                {/* Content */}
                <div className="space-y-8">
                  {currentSection.subsections.map((subsection, idx) => (
                    <div key={idx} className="space-y-4">
                      {/* Subsection Title */}
                      <button
                        onClick={() => setExpandedSubsection(expandedSubsection === `${activeSection}-${idx}` ? null : `${activeSection}-${idx}`)}
                        className="flex items-center justify-between w-full text-left group"
                      >
                        <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {subsection.title}
                        </h2>
                        <span className="text-gray-400 group-hover:text-white transition-colors">
                          {expandedSubsection === `${activeSection}-${idx}` ? '▼' : '▶'}
                        </span>
                      </button>

                      {/* Subsection Content */}
                      {expandedSubsection === `${activeSection}-${idx}` && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          <p className="text-gray-300 leading-relaxed">{subsection.content}</p>

                          {/* Code Block */}
                          {subsection.code && (
                            <div className="card !p-0 overflow-hidden">
                              <div className="bg-black/60 border-b border-white/10 px-6 py-3 flex items-center justify-between">
                                <code className="text-sm font-mono text-gray-400">
                                  {subsection.language || 'code'}
                                </code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(subsection.code!)}
                                  className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className="p-6 overflow-x-auto">
                                <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                                  {subsection.code}
                                </code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Divider between subsections */}
                      {idx < currentSection.subsections.length - 1 && (
                        <div className="h-px bg-white/5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Support CTA */}
                <div className="card bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border-indigo-500/20 p-8 text-center space-y-6 mt-12">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Need More Help?</h3>
                    <p className="text-gray-400">Contact our support team for personalized assistance</p>
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                      📧 Contact Support
                    </button>
                    <button className="px-6 py-3 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 font-semibold rounded-lg transition-all">
                      💬 Join Community
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PremiumLayout>
  );
}
