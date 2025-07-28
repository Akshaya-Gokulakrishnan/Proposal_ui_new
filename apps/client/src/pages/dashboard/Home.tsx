import React, { useEffect } from 'react';
import { FiArrowRight, FiClock, FiEdit, FiFileText, FiFolder, FiPlus, FiTag, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, fetchDashboardData } = useDashboard();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="p-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        <div className="p-8">
          <div className="text-center py-20">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Active Workspaces',
      value: dashboardData?.stats.total_workspaces?.toString() || '0',
      icon: FiFolder,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Content Pieces',
      value: dashboardData?.stats.total_sections?.toString() || '0',
      icon: FiFileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      label: 'Saved Prompts',
      value: dashboardData?.stats.total_prompts?.toString() || '0',
      icon: FiEdit,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Generated Content',
      value: dashboardData?.stats.total_generated_content?.toString() || '0',
      icon: FiZap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks}w ago`;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600 text-lg">
              Ready to create your next winning proposal?
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/content-ingestion')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFileText className="w-4 h-4" />
              <span className="text-sm font-medium">Add Content</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/workspaces?create=1')}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-2xl p-6 border ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Workspaces */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Workspaces</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Continue where you left off
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/workspaces')}
                    className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-colors"
                  >
                    View all
                  </button>
                </div>
              </div>
              <div className="p-6">
                {dashboardData?.recent_workspaces && dashboardData.recent_workspaces.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recent_workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        onClick={() => navigate(`/dashboard/workspaces/${ws.id}`)}
                        className="group p-4 border border-gray-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-3">
                                <FiFolder className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{ws.name}</h3>
                                <p className="text-sm text-gray-600">Client: {ws.client}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 ml-13">
                              <FiClock className="w-4 h-4 mr-1" />
                              {ws.last_used_at ? formatTimeAgo(ws.last_used_at) : 'Never used'}
                            </div>
                          </div>
                          <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFolder className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No recent workspaces
                    </h3>
                    <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
                    <button
                      onClick={() => navigate('/dashboard/workspaces?create=1')}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
                    >
                      Create Workspace
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600 mt-1">Jump into your workflow</p>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={() => navigate('/dashboard/workspaces?create=1')}
                  className="w-full p-4 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
                >
                  <div className="flex items-center">
                    <FiPlus className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <span className="font-semibold block">New Workspace</span>
                      <span className="text-white/80 text-sm">Start organizing content</span>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/dashboard/content-ingestion')}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <FiFileText className="w-5 h-5 mr-3 text-primary" />
                    <div className="text-left">
                      <span className="font-semibold text-gray-900 block">Upload Content</span>
                      <span className="text-gray-600 text-sm">Add documents & resources</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/dashboard/prompt-templates')}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <FiEdit className="w-5 h-5 mr-3 text-primary" />
                    <div className="text-left">
                      <span className="font-semibold text-gray-900 block">Browse Templates</span>
                      <span className="text-gray-600 text-sm">Ready-to-use prompts</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FiZap className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900">Pro Tip</h3>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">
                Start by creating a workspace for your client, then upload relevant documents to build a content library for AI-powered proposal generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;