import { useEffect, useState } from "react";
import DatabaseTreeView from "../components/dashboard/DatabaseTreeView";
import InMemoryCacheCard from "../components/dashboard/InMemoryCacheCard";
import StorageUsageCard from "../components/dashboard/StorageUsageCard";
import TotalCollectionsCard from "../components/dashboard/TotalCollectionsCard";
import TotalDatabasesCard from "../components/dashboard/TotalDatabasesCard";
import TotalDocumentsCard from "../components/dashboard/TotalDocumentsCard";

/**
 * Dashboard page component
 * Displays overview metrics and charts
 */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to AxioDB Management Console</p>
      </div>

      {loading ? (
        // Loading skeleton for metrics
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-32 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        // Stats cards row
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <TotalDatabasesCard />
          <TotalCollectionsCard />
          <TotalDocumentsCard />
          <StorageUsageCard />
          <InMemoryCacheCard />
        </div>
      )}

      {/* Database Tree View */}
      <div className="mb-8">
        <DatabaseTreeView />
      </div>
    </div>
  );
};

export default Dashboard;
