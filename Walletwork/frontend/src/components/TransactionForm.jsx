import { useState } from 'react';

export default function TransactionForm({ onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        wallet: '',
        contract: '',
        tx_type: 'send'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isFormValid = formData.wallet && formData.contract;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Wallet Address
                </label>
                <input
                    type="text"
                    name="wallet"
                    value={formData.wallet}
                    onChange={handleChange}
                    placeholder="0x..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contract Address
                </label>
                <input
                    type="text"
                    name="contract"
                    value={formData.contract}
                    onChange={handleChange}
                    placeholder="0x..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Transaction Type
                </label>
                <select
                    name="tx_type"
                    value={formData.tx_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                    <option value="send">Send</option>
                    <option value="approve">Approve</option>
                    <option value="swap">Swap</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors
          ${!isFormValid || isLoading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isLoading ? 'Analyzing...' : 'Analyze Transaction'}
            </button>
        </form>
    );
}
