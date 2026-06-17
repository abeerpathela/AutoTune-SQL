interface OptimizationResultProps {
  originalQuery: string;
  optimizedQuery: string;
  explanation: string;
}

const OptimizationResult: React.FC<OptimizationResultProps> = ({
  originalQuery,
  optimizedQuery,
  explanation
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          ✨ Query Optimized
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Original</h3>
          </div>
          <pre className="p-4 bg-gray-50 overflow-x-auto">
            <code className="text-sm text-gray-700">{originalQuery}</code>
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Optimized</h3>
          </div>
          <pre className="p-4 bg-blue-50 overflow-x-auto">
            <code className="text-sm text-gray-700">{optimizedQuery}</code>
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">AI Explanation</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-700">{explanation}</p>
        </div>
      </div>
    </div>
  );
};

export default OptimizationResult;
