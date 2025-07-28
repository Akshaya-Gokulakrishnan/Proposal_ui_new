import React, { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiEye,
  FiFile,
  FiFileText,
  FiGlobe,
  FiLoader,
  FiPlus,
  FiSearch,
  FiTag,
  FiX,
  FiZap
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useSections, type Section } from '../../hooks/useSections';
import { useSources } from '../../hooks/useSources';
import { useTags } from '../../hooks/useTags';
import { useWorkspace } from '../../hooks/useWorkspace';
import { API } from '../../utils/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Workspace = {
  id: string;
  name: string;
  clientName?: string;
  tags: string[];
  workspaceType?: string;
};

const WorkspaceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewingSection, setViewingSection] = useState<Section | null>(null);
  const [currentTags, setCurrentTags] = useState<any[]>([]);
  const { listSources } = useSources();
  const [sourceChunks, setSourceChunks] = useState<any[]>([]);
  const [sourceText, setSourceText] = useState('');
  const [extractedResults, setExtractedResults] = useState<any[]>([]);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  // Add state for search and selection
  const [sourceSearch, setSourceSearch] = useState('');
  const [selectedSources, setSelectedSources] = useState<any[]>([]);
  const [selectedSourceForChunks, setSelectedSourceForChunks] = useState<any | null>(null);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [selectedChunks, setSelectedChunks] = useState<number[]>([]); // store chunk indices
  const [tab, setTab] = useState<'content' | 'sections'>('content');
  const [sectionPrompts, setSectionPrompts] = useState<{ [sectionId: string]: any[] }>({});
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [sectionTemplates, setSectionTemplates] = useState<any[]>([]);
  const [sectionTemplatesLoading, setSectionTemplatesLoading] = useState(false);
  const [workspaceTypeName, setWorkspaceTypeName] = useState<string | null>(null);

  const { createSections } = useSections();

  const debouncedSearch = useDebounce(search, 500);

  const { fetchWorkspace } = useWorkspace();
  const { fetchSections, searchSections } = useSections();
  const { fetchAllSectionTags } = useTags();

  useEffect(() => {
    const fetchTagsForSections = async () => {
      try {
        const tags = await fetchAllSectionTags();
        setCurrentTags(tags);
      } catch (error) {
        console.error('Failed to fetch section tags:', error);
        setCurrentTags([]);
      }
    };

    fetchTagsForSections();
  }, [fetchAllSectionTags]);

  useEffect(() => {
    if (!id) return;

    const loadWorkspaceData = async () => {
      try {
        setLoading(true);

        const workspaceData = await fetchWorkspace(id);
        if (!workspaceData) {
          setWorkspace(null);
          setLoading(false);
          return;
        }

        setWorkspace({
          id: workspaceData.id,
          name: workspaceData.name,
          clientName: workspaceData.client,
          tags: workspaceData.tags || [],
          workspaceType: workspaceData.workspaceType,
        });

        // Fetch workspace type name if workspaceType is a number
        if (workspaceData.workspaceType && typeof workspaceData.workspaceType === 'number') {
          try {
            const res = await fetch(`${API.BASE_URL()}/api/prompt-templates/types/${workspaceData.workspaceType}`,
              { headers: { Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '' } });
            if (res.ok) {
              const data = await res.json();
              setWorkspaceTypeName(data.name || String(workspaceData.workspaceType));
            } else {
              setWorkspaceTypeName(String(workspaceData.workspaceType));
            }
          } catch {
            setWorkspaceTypeName(String(workspaceData.workspaceType));
          }
        } else if (workspaceData.workspaceType && typeof workspaceData.workspaceType === 'string') {
          setWorkspaceTypeName(workspaceData.workspaceType);
        } else {
          setWorkspaceTypeName(null);
        }

        const sectionsData = await fetchSections(id);
        setAllSections(sectionsData);
        setSections(sectionsData);
      } catch (error) {
        console.error('Failed to fetch workspace data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const performSearch = async () => {
      try {
        if (debouncedSearch || selectedTags.length > 0) {
          const searchResults = await searchSections(
            id,
            debouncedSearch || undefined,
            undefined,
            selectedTags.length > 0 ? selectedTags : undefined,
          );
          setSections(searchResults);
        } else {
          setSections(allSections);
        }
      } catch (error) {
        console.error('Failed to search sections:', error);
        setSections(allSections);
      }
    };

    performSearch();
  }, [debouncedSearch, selectedTags, id, allSections]);

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();

    allSections.forEach((section) => {
      section.tags?.forEach((tag) => tagSet.add(tag));
    });

    currentTags.forEach((tag) => tagSet.add(tag.name));

    return Array.from(tagSet).sort();
  }, [allSections, currentTags]);

  const getFilteredData = React.useCallback(() => {
    if (!search) return sections;

    return sections.filter((section: any) => {
      const searchLower = search.toLowerCase();
      return (
        section.content.toLowerCase().includes(searchLower) ||
        (section.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
        (section.name && section.name.toLowerCase().includes(searchLower)) ||
        (section.content_source && section.content_source.toLowerCase().includes(searchLower))
      );
    });
  }, [sections, search]);

  const filteredData = getFilteredData();

  const toggleTag = React.useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleViewSection = React.useCallback((section: Section, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingSection(section);
  }, []);

  const closeModal = React.useCallback(() => {
    setViewingSection(null);
  }, []);

  // Fetch sources for this workspace
  const fetchSources = async () => {
    try {
      const allSources = await listSources();
      setExtractedResults(allSources);
    } catch (err) {
      setExtractedResults([]);
    }
  };

  // Fetch chunks/text for a source (mocked, replace with real fetch if needed)
  const fetchSourceChunks = async (source: any) => {
    // TODO: Replace with real API call to fetch chunks and extracted text for the source
    setSourceChunks(source.chunks || []);
    setSourceText(source.extracted_text || '');
  };

  // Fetch sources when modal opens
  useEffect(() => {
    if (isAddContentModalOpen) {
      setSourcesLoading(true);
      listSources()
        .then((data) => {
          // Always use data.sources if present and is an array, otherwise fallback to data if it's an array
          if (data && Array.isArray(data.sources)) {
            setSources(data.sources);
          } else if (Array.isArray(data)) {
            setSources(data);
          } else {
            setSources([]);
          }
        })
        .catch(() => setSources([]))
        .finally(() => setSourcesLoading(false));
    }
  }, [isAddContentModalOpen, listSources]);

  // Filtered sources logic
  const filteredSources = sources.filter(
    (source) =>
      source.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      source.type.toLowerCase().includes(sourceSearch.toLowerCase()),
  );

  const toggleSourceSelection = (source: any) => {
    setSelectedSources((prev) => {
      const exists = prev.find((s) => s.id === source.id);
      if (exists) {
        return prev.filter((s) => s.id !== source.id);
      } else {
        return [...prev, source];
      }
    });
  };

  // Fetch chunks for a source
  const handleAddSource = (source: any) => {
    // Navigate to the in-page chunk selection view
    navigate(`/dashboard/workspaces/${workspace?.id}/add-content/${source.id}`);
  };

  const handleToggleChunk = (idx: number) => {
    setSelectedChunks((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const handleSaveChunksToWorkspace = async () => {
    if (!selectedSourceForChunks || selectedChunks.length === 0 || !workspace) return;
    // Prepare sections payload
    const sections = selectedChunks.map((idx) => {
      const chunk = sourceChunks[idx];
      return {
        content: chunk.content,
        name: chunk.label || chunk.content.substring(0, 50) + '...',
        tags: [],
      };
    });
    // Save to workspace
    try {
      await createSections(parseInt(workspace.id), selectedSourceForChunks.name, sections);
      // Reset modal state
      setSelectedSourceForChunks(null);
      setSourceChunks([]);
      setSelectedChunks([]);
      setIsAddContentModalOpen(false);
      // Optionally, show a toast or reload workspace sections
    } catch (err) {
      // Optionally, show error toast
    }
  };

  // Fetch prompt for a section
  const fetchPromptForSection = async (sectionId: string | number) => {
    setPromptLoading(true);
    try {
      const res = await fetch(
        `${API.BASE_URL()}/api/prompt-templates/sections/${sectionId}/prompts`,
        {
          headers: {
            Authorization: localStorage.getItem('token')
              ? `Bearer ${localStorage.getItem('token')}`
              : '',
          },
        },
      );
      if (!res.ok) throw new Error('Failed to fetch prompt');
      const data = await res.json();
      // Use the first prompt or empty string
      setSectionPrompts((prev) => ({ ...prev, [sectionId]: data }));
    } catch (err) {
      setSectionPrompts((prev) => ({ ...prev, [sectionId]: [] }));
    } finally {
      setPromptLoading(false);
    }
  };

  // Fetch section templates for the workspace type
  const fetchSectionTemplates = async (workspaceTypeId: string | number) => {
    setSectionTemplatesLoading(true);
    try {
      const res = await fetch(
        `${API.BASE_URL()}/api/prompt-templates/types/${workspaceTypeId}/sections`,
        {
          headers: {
            Authorization: localStorage.getItem('token')
              ? `Bearer ${localStorage.getItem('token')}`
              : '',
          },
        },
      );
      if (!res.ok) throw new Error('Failed to fetch section templates');
      const data = await res.json();
      setSectionTemplates(data);
    } catch (err) {
      setSectionTemplates([]);
    } finally {
      setSectionTemplatesLoading(false);
    }
  };

  // Fetch section templates when switching to the Sections tab
  useEffect(() => {
    if (tab === 'sections' && workspace?.workspaceType) {
      fetchSectionTemplates(workspace.workspaceType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, workspace?.workspaceType]);

  const fetchPromptsForSection = async (sectionId: string | number) => {
    setPromptsLoading(true);
    try {
      const res = await fetch(
        `${API.BASE_URL()}/api/prompt-templates/sections/${sectionId}/prompts`,
        {
          headers: {
            Authorization: localStorage.getItem('token')
              ? `Bearer ${localStorage.getItem('token')}`
              : '',
          },
        },
      );
      if (!res.ok) throw new Error('Failed to fetch prompts');
      const data = await res.json();
      setSectionPrompts((prev) => ({ ...prev, [sectionId]: data }));
    } catch (err) {
      setSectionPrompts((prev) => ({ ...prev, [sectionId]: [] }));
    } finally {
      setPromptsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FiFileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Workspace not found</h3>
          <p className="text-gray-600 mb-6">The workspace you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/workspaces')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Add Content Modal */}
      {isAddContentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Add Content from Existing Sources
              </h3>
              <button
                onClick={() => setIsAddContentModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search existing sources..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            {sourcesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="text-center py-12">
                <FiFile className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content sources found</h3>
                <p className="text-gray-500 mb-4">You haven't uploaded any content sources yet.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-3 border rounded-lg flex items-center justify-between transition-all ${
                      selectedSourceForChunks && selectedSourceForChunks.id === source.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {source.type === 'pdf' && <FiFile className="w-4 h-4 text-red-500" />}
                      {source.type === 'docx' && <FiFile className="w-4 h-4 text-blue-500" />}
                      {source.type === 'web' && <FiGlobe className="w-4 h-4 text-green-500" />}
                      {!['pdf', 'docx', 'web'].includes(source.type) && (
                        <FiFile className="w-4 h-4 text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-medium text-black">{source.name}</h4>
                        <p className="text-sm text-gray-500">
                          {source.type.toUpperCase()} •{' '}
                          {source.created_at
                            ? new Date(source.created_at).toLocaleDateString()
                            : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      className="ml-4 p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                      title="Add"
                      onClick={() => handleAddSource(source)}
                    >
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Chunks display for selected source */}
            {selectedSourceForChunks && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">
                  Select Chunks from: {selectedSourceForChunks.name}
                </h4>
                {chunksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FiLoader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <span className="ml-2 text-gray-500">Loading chunks...</span>
                  </div>
                ) : sourceChunks.length === 0 ? (
                  <div className="text-gray-500">No chunks found for this source.</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sourceChunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          selectedChunks.includes(idx)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleToggleChunk(idx)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-black">
                            {chunk.label || chunk.content.substring(0, 50) + '...'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {chunk.page && `Page ${chunk.page} • `}
                            {chunk.section_type && `${chunk.section_type}`}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedChunks.includes(idx)}
                          onChange={() => handleToggleChunk(idx)}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary ml-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveChunksToWorkspace}
                    disabled={selectedChunks.length === 0}
                    className={`py-2 px-6 rounded-lg font-semibold transition-colors ml-2 ${
                      selectedChunks.length > 0
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save to Workspace
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsAddContentModalOpen(false)}
                className="py-2 px-6 rounded-lg border border-gray-300 text-neutral-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <button
                    onClick={() => navigate('/dashboard/workspaces')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
                </div>
                {workspace.clientName && (
                  <p className="text-gray-600 ml-11">
                    <span className="font-medium">Client:</span> <span className="font-semibold">{workspace.clientName}</span>
                    {workspaceTypeName && (
                      <span className="ml-4">
                        <span className="font-medium">Type:</span> <span className="font-semibold">{workspaceTypeName}</span>
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAddContentModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Content</span>
                </button>
                <button
                  onClick={() =>
                    navigate('/dashboard/proposal-authoring', {
                      state: { workspaceId: workspace.id, workspaceType: workspace.workspaceType },
                    })
                  }
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
                >
                  <FiZap className="w-4 h-4" />
                  Author Proposal
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mt-6">
              <button
                className={`px-6 py-3 font-semibold text-sm rounded-t-xl focus:outline-none transition-all duration-200 ${
                  tab === 'content'
                    ? 'bg-white border-x border-t border-primary text-primary -mb-px shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:text-primary hover:bg-gray-100'
                }`}
                onClick={() => setTab('content')}
              >
                Content
              </button>
              <button
                className={`px-6 py-3 font-semibold text-sm rounded-t-xl focus:outline-none transition-all duration-200 ${
                  tab === 'sections'
                    ? 'bg-white border-x border-t border-primary text-primary -mb-px shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:text-primary hover:bg-gray-100'
                }`}
                onClick={() => setTab('sections')}
              >
                Sections
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {tab === 'content' && (
            <>
              <div className="mb-8 space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search sections by content, name, source, or tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-96 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 bg-white shadow-sm"
                  />
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2 py-2">Filter by tags:</span>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-primary/5 hover:border-primary/30'
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium flex items-center"
                      >
                        <FiTag className="inline w-3 h-3 mr-1" />
                        {tag}
                        {selectedTags.includes(tag) && (
                          <span className="ml-1 text-xs">
                            ({sections.filter((s) => s.tags?.includes(tag)).length})
                          </span>
                        )}
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

                {selectedTags.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredData.length} sections
                    {search && ` matching "${search}"`}
                    {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
                  </div>
                )}
              </div>

              {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData.map((section) => (
                    <div
                      key={section.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group cursor-pointer relative overflow-hidden"
                    >
                      {/* Background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 relative z-10">
                          {section.tags && section.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {section.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium flex items-center"
                                >
                                  <FiTag className="w-3 h-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(() => {
                            let parsedContent: any[] = [];
                            let previewText = '';

                            if (typeof section.content === 'string') {
                              try {
                                // Try to parse as JSON first
                                const parsed = JSON.parse(section.content.replace(/'/g, '"'));
                                if (Array.isArray(parsed)) {
                                  parsedContent = parsed;
                                } else {
                                  // If it's not an array, treat as simple content
                                  previewText = section.content;
                                }
                              } catch (e) {
                                // If JSON parsing fails, treat as plain text
                                previewText = section.content;
                              }
                            } else if (Array.isArray(section.content)) {
                              parsedContent = section.content;
                            } else {
                              // Fallback to string representation
                              previewText = String(section.content || '');
                            }

                            // If we have parsed content array, extract text from it
                            if (parsedContent.length > 0) {
                              previewText = parsedContent
                                .map((item: any) => {
                                  if (Array.isArray(item.content)) {
                                    return item.content.map((c: any) => c.text || c.content || '').join(' ');
                                  } else if (item.content) {
                                    return typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
                                  } else if (item.text) {
                                    return item.text;
                                  } else {
                                    return '';
                                  }
                                })
                                .join(' ');
                            }

                            // If we still don't have preview text, use the raw content
                            if (!previewText && section.content) {
                              if (typeof section.content === 'string') {
                                previewText = section.content;
                              } else {
                                previewText = JSON.stringify(section.content);
                              }
                            }

                            // Heading: first non-empty tag, else section.name (if not 'Chunk X'), else section.source
                            let heading = '';
                            if (parsedContent.length > 0) {
                              const firstTag = parsedContent.find(
                                (item: any) =>
                                  item.tag &&
                                  item.tag.trim() !== '' &&
                                  item.tag.trim().toLowerCase() !== 'untitled section',
                              );
                              if (firstTag) heading = firstTag.tag;
                            }

                            const isChunkName =
                              typeof section.name === 'string' &&
                              /^chunk\s*\d+$/i.test(section.name.trim());
                            if (
                              (!heading ||
                                heading.trim() === '' ||
                                heading.toLowerCase().startsWith('chunk ')) &&
                              section.name &&
                              !isChunkName
                            ) {
                              heading = section.name;
                            } else if (
                              !heading ||
                              heading.trim() === '' ||
                              heading.toLowerCase().startsWith('chunk ') ||
                              isChunkName
                            ) {
                              heading = section.content_source || 'Section';
                            }

                            return (
                              <>
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {heading}
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                                  {previewText || 'No content available'}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0 relative z-10">
                          <button
                            onClick={(e) => handleViewSection(section, e)}
                            className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 rounded-lg"
                            title="View full content"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this content chunk?')) {
                                try {
                                  await fetch(`${API.BASE_URL()}/api/sections/hard/${section.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
                                    },
                                  });
                                  setSections((prev) => prev.filter((s) => s.id !== section.id));
                                  setAllSections((prev) => prev.filter((s) => s.id !== section.id));
                                } catch (err) {
                                  alert('Failed to delete section.');
                                }
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 rounded-lg"
                            title="Delete content chunk"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 relative z-10">
                        <div className="flex items-center">
                          <FiFileText className="w-4 h-4 mr-1" />
                          {section.content_source}
                        </div>
                        <div className="flex items-center">
                          <span>{section.content.split(' ').length} words</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiFileText className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No content found</h3>
                    <p className="text-gray-600 mb-8">
                      {search || selectedTags.length > 0
                        ? 'Try adjusting your search or filters.'
                        : 'Get started by adding some content to this workspace.'}
                    </p>
                    {!search && selectedTags.length === 0 && (
                      <button
                        onClick={() => setIsAddContentModalOpen(true)}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25"
                      >
                        <FiPlus className="w-5 h-5 inline mr-2" />
                        Add Your First Content
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {tab === 'sections' && (
            <div className="flex gap-6 min-h-[400px]">
              {/* Left: Section List */}
              <div className="w-64 bg-white border border-gray-200 rounded-2xl p-4 flex-shrink-0 overflow-y-auto max-h-[500px] shadow-sm">
                <h3 className="text-base font-bold mb-4 text-gray-900">Template Sections</h3>
                {sectionTemplatesLoading ? (
                  <div className="text-gray-500 text-sm">Loading...</div>
                ) : sectionTemplates.length === 0 ? (
                  <div className="text-gray-400 text-sm">No section templates found.</div>
                ) : (
                  <ul className="space-y-1">
                    {sectionTemplates.map((section) => {
                      const sectionIdStr = String(section.id);
                      const isSelected = selectedSectionId === sectionIdStr;
                      return (
                        <li key={sectionIdStr}>
                          <button
                            className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                              isSelected
                                ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-md'
                                : 'bg-gray-50 text-gray-800 hover:bg-primary/10 hover:text-primary'
                            }`}
                            onClick={() => {
                              setSelectedSectionId(sectionIdStr);
                              fetchPromptsForSection(sectionIdStr);
                            }}
                          >
                            {section.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Right: Prompts for selected section */}
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 min-h-[300px] shadow-sm">
                {!selectedSectionId ? (
                  <div className="text-center mt-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Select a section to view its prompts</p>
                  </div>
                ) : promptsLoading ? (
                  <div className="text-center mt-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading prompts...</p>
                  </div>
                ) : sectionPrompts[selectedSectionId] && sectionPrompts[selectedSectionId].length > 0 ? (
                  <div>
                    <h4 className="text-lg font-bold mb-4 text-gray-900">Available Prompts</h4>
                    <ul className="space-y-4">
                      {sectionPrompts[selectedSectionId].map((prompt: any, idx: number) => (
                        <li key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                          <div className="font-semibold text-gray-900 mb-2">Prompt {idx + 1}</div>
                          <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">{prompt.prompt}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center mt-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiFileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No prompts found for this section</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewingSection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {(() => {
                    let parsedContent: any[] = [];
                    if (typeof viewingSection.content === 'string') {
                      try {
                        parsedContent = JSON.parse(viewingSection.content.replace(/'/g, '"'));
                      } catch (e) {
                        parsedContent = [];
                      }
                    }
                    if (!Array.isArray(parsedContent)) {
                      parsedContent = [];
                    }
                    return viewingSection.name || 'Untitled Section';
                  })()}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiFileText className="w-4 h-4 mr-1" />
                    {viewingSection.content_source}
                  </div>
                  <div className="flex items-center">
                    <span>{viewingSection.content.split(' ').length} words</span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {viewingSection.tags && viewingSection.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {viewingSection.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium flex items-center"
                    >
                      <FiTag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {(() => {
                    // Debug: log the content
                    console.log('Modal viewingSection.content:', viewingSection.content);

                    if (!viewingSection.content || (typeof viewingSection.content === 'string' && viewingSection.content.trim() === '')) {
                      return <span className="text-gray-400">No content available</span>;
                    }

                    let parsedContent: any[] = [];
                    if (typeof viewingSection.content === 'string') {
                      try {
                        parsedContent = JSON.parse(viewingSection.content.replace(/'/g, '"'));
                      } catch (e) {
                        parsedContent = [];
                      }
                    }

                    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
                      return parsedContent
                        .map((item: any) => {
                          // If item has a content array, use the old logic
                          if (Array.isArray(item.content)) {
                            return item.content
                              .map(
                                (c: any) =>
                                  (c.page_number ? `Page ${c.page_number}\n` : '') + (c.text || ''),
                              )
                              .join('\n\n');
                          }
                          // Otherwise, just show text and page_number if present
                          return (item.page_number ? `Page ${item.page_number}\n` : '') + (item.text || '');
                        })
                        .join('\n\n');
                    }

                    // Otherwise, just show the raw content as plain text
                    return viewingSection.content;
                  })()}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Source: {viewingSection.content_source}</div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this content chunk?')) {
                        try {
                          await fetch(`${API.BASE_URL()}/api/sections/hard/${viewingSection.id}`, {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
                            },
                          });
                          setSections((prev) => prev.filter((s) => s.id !== viewingSection.id));
                          setAllSections((prev) => prev.filter((s) => s.id !== viewingSection.id));
                          closeModal();
                        } catch (err) {
                          alert('Failed to delete section.');
                        }
                      }
                    }}
                    className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                  >
                    Delete
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceView;
