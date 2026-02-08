export default function RiskCard({ result }) {
    if (!result) return null;

    const { risk, score, reasons } = result;

    const getRiskColor = (risk) => {
        switch (risk) {
            case "SAFE":
                return "bg-green-100 text-green-800 border-green-200";
            case "SUSPICIOUS":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "HIGH_RISK":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className={`p-6 rounded-lg border ${getRiskColor(risk)} shadow-lg mt-6`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{risk.replace("_", " ")}</h2>
                <span className="text-xl font-semibold">Score: {score}/100</span>
            </div>

            {reasons && reasons.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-semibold mb-2">Risk Factors:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        {reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
