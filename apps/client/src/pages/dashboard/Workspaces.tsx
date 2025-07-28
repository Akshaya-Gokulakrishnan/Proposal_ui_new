import React, { useEffect, useState } from 'react';
import { FiFolder, FiPlus, FiSearch, FiTag, FiTrash2, FiZap, FiFileText, FiClock } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useSections } from '../../hooks/useSections';
import { useWorkspace } from '../../hooks/useWorkspace';
import CreateWorkspace from './CreateWorkspace';

const Workspaces: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, getAllTags, filterWorkspaces, fetchWorkspaces, loading, deleteWorkspace } =
    useWorkspace();
  const { fetchSections } = useSections();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sectionCounts, setSectionCounts] = useState<{ [workspaceId: string]: number }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const tags = getAllTags();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  useEffect(() => {
    const performFilter = async () => {
      if (debouncedSearch || selectedTags.length > 0) {
        await filterWorkspaces(
          debouncedSearch || undefined,
          selectedTags.length > 0 ? selectedTags : undefined,
        );
      } else {
        await fetchWorkspaces();
      }
    };

    performFilter();
  }, [debouncedSearch, selectedTags]);

  useEffect(() => {
    const fetchAllSectionCounts = async () => {
      const counts: { [workspaceId: string]: number } = {};
      await Promise.all(
        workspaces.map(async (workspace) => {
          try {
            const sections = await fetchSections(workspace.id);
            counts[workspace.id] = Array.isArray(sections) ? sections.length : 0;
          } catch {
            counts[workspace.id] = 0;
          }
        }),
      );
      setSectionCounts(counts);
    };
    if (workspaces.length > 0) {
      fetchAllSectionCounts();
    }
  }, [workspaces]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setShowCreateModal(true);
    }
  }, [location.search]);

  const handleWorkspaceCreated = (newWorkspace: any) => {
    setShowCreateModal(false);
    fetchWorkspaces();
    if (newWorkspace && newWorkspace.id) {
      navigate(`/dashboard/proposal-authoring/${newWorkspace.id}`, {
        state: {
          workspaceId: newWorkspace.id,
          workspaceName: newWorkspace.name,
        },
      });
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
              <p className="text-gray-600 mt-1">
                Organize and manage your proposal content libraries
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
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
              >
                <FiPlus className="w-4 h-4" />
                <span>New Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 bg-white shadow-sm"
              />
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2 py-2">Filter by tags:</span>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-primary/5 hover:border-primary/30'
                    }`}
                  >
                    <FiTag className="inline w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading workspaces...</p>
            </div>
          ) : workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer relative overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this workspace?')) {
                        deleteWorkspace(workspace.id);
                      }
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    title="Delete workspace"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>

                  <div 
                    onClick={() => navigate(`/dashboard/workspaces/${workspace.id}`)}
                    className="relative z-0"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center mr-4">
                          <FiFolder className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                            {workspace.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {workspace.clientName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {workspace.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {workspace.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium flex items-center"
                          >
                            <FiTag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {workspace.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                            +{workspace.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <FiFileText className="w-4 h-4 mr-1" />
                        <span>{sectionCounts[workspace.id] ?? 0} content pieces</span>
                      </div>
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        <span>Updated today</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/workspaces/${workspace.id}`);
                        }}
                        className="flex-1 py-2 px-3 text-primary bg-primary/10 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        View Content
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/dashboard/proposal-authoring', {
                            state: { workspaceId: workspace.id, workspaceType: workspace.workspaceType },
                          });
                        }}
                        className="flex-1 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                      >
                        <FiZap className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiFolder className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {search || selectedTags.length > 0 ? 'No workspaces found' : 'Create your first workspace'}
                </h3>
                <p className="text-gray-600 mb-8">
                  {search || selectedTags.length > 0
                    ? 'Try adjusting your search or filter criteria'
                    : 'Organize your proposal content and start generating professional documents'}
                </p>
                {!search && selectedTags.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
                  >
                    <FiPlus className="w-5 h-5 inline mr-2" />
                    Create Your First Workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CreateWorkspace
              onWorkspaceCreated={handleWorkspaceCreated}
              onClose={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;