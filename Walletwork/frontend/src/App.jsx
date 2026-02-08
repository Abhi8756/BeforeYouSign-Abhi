import { useState } from 'react';
import TransactionForm from './components/TransactionForm';
import RiskCard from './components/RiskCard';
import Loader from './components/Loader';

function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (formData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Transaction Risk Detector
          </h1>
          <p className="mt-2 text-gray-400">
            Analyze Web3 transactions before signing.
          </p>
        </div>

        <div className="bg-gray-800 py-8 px-6 shadow rounded-lg border border-gray-700">
          <TransactionForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {isLoading && <Loader />}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <RiskCard result={result} />
      </div>
    </div>
  );
}

export default App;
