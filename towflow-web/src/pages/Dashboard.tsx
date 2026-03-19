import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Dashboard</h1>
      <p className="text-lg text-center mb-6">
        View trips, drivers, and revenue
      </p>

      <button
        onClick={() => navigate('/')}
        className="bg-white text-gray-900 font-bold py-2 px-4 rounded-md mt-4"
      >
        Back to Home
      </button>
    </div>
  );
}
