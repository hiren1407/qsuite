import { useState, useEffect } from "react";
import { 
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";

const Queue = () => {
  const [testRuns, setTestRuns] = useState([]);
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, passed, failed, not-ran
    category: 'all',
    testCase: 'all',
    dateRange: 'all', // all, today, week, month
    searchText: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTestRuns();
    fetchCategories();
    fetchTestCases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [testRuns, filters]);

  const fetchTestRuns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all test cases first
      const { data: allTestCases, error: testCasesError } = await supabase
        .from('test_cases')
        .select(`
          id,
          name,
          test_categories(id, name)
        `)
        .eq('user_id', user.id);

      if (testCasesError) {
        console.error('Error fetching test cases:', testCasesError);
        setTestRuns([]);
        setLoading(false);
        return;
      }

      // Fetch test runs
      const { data: testRunsData, error: testRunsError } = await supabase
        .from('test_runs')
        .select(`
          *,
          test_cases(
            id,
            name,
            test_categories(id, name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (testRunsError) {
        console.error('Error fetching test runs:', testRunsError);
      }

      // Create a map of test case IDs that have been run
      const runTestCaseIds = new Set((testRunsData || []).map(run => run.test_case_id));
      
      // Create combined data: test runs + unrun test cases
      const allData = [
        ...(testRunsData || []),
        ...(allTestCases || [])
          .filter(testCase => !runTestCaseIds.has(testCase.id))
          .map(testCase => ({
            id: `unrun-${testCase.id}`,
            test_case_id: testCase.id,
            status: 'not-ran',
            started_at: null,
            completed_at: null,
            duration: null,
            result: null,
            user_id: user.id,
            created_at: null,
            test_cases: testCase
          }))
      ];
      
      setTestRuns(allData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching test runs:', error);
      setTestRuns([]);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('test_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTestCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('test_cases')
        .select(`
          *,
          test_categories(id, name)
        `)
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setTestCases(data || []);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...testRuns];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(run => run.status === filters.status);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(run => 
        run.test_cases?.test_categories?.id === parseInt(filters.category)
      );
    }

    // Test case filter
    if (filters.testCase !== 'all') {
      filtered = filtered.filter(run => run.test_case_id === parseInt(filters.testCase));
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(run => 
        new Date(run.created_at) >= startDate
      );
    }

    // Search text filter
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(run =>
        run.test_cases?.name.toLowerCase().includes(searchLower) ||
        run.test_cases?.test_categories?.name.toLowerCase().includes(searchLower) ||
        run.status.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRuns(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      category: 'all',
      testCase: 'all',
      dateRange: 'all',
      searchText: ''
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'not-ran':
        return <PlayIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'passed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'not-ran':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.testCase !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.searchText.trim()) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Queue</h1>
            <p className="text-gray-600 mt-1">
              {filteredRuns.length} run(s) {filteredRuns.length !== testRuns.length && `of ${testRuns.length} total`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchTestRuns()}
              className="btn btn-ghost btn-sm"
              title="Refresh"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="badge badge-error badge-xs ml-2">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search test runs..."
            className="input input-bordered w-full pl-10"
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="not-ran">Not Ran</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Case Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Case
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.testCase}
                onChange={(e) => handleFilterChange('testCase', e.target.value)}
              >
                <option value="all">All Test Cases</option>
                {testCases.map(testCase => (
                  <option key={testCase.id} value={testCase.id}>
                    {testCase.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Test Runs Table */}
      <div className="flex-1 overflow-auto">
        {filteredRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Test Case</th>
                  <th>Category</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(run.status)}
                        <span className={getStatusBadge(run.status)}>
                          {run.status === 'not-ran' ? 'Not Ran' : 
                           run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {run.test_cases?.name || 'Unknown Test'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <FolderIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="badge badge-outline badge-sm">
                          {run.test_cases?.test_categories?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm">
                          {run.started_at ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {formatDateTime(run.started_at)}
                              </div>
                              {run.completed_at && (
                                <div className="text-gray-500">
                                  Completed: {formatDateTime(run.completed_at)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500">Not started</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium">
                        {formatDuration(run.duration)}
                      </span>
                    </td>
                    <td>
                      <div className="max-w-xs">
                        {run.result ? (
                          <div className="text-sm">
                            <div className={`font-medium ${
                              run.result.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {run.result.success ? 'Success' : 'Failed'}
                            </div>
                            <div className="text-gray-500 truncate">
                              {run.result.message}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No test runs found
            </h3>
            <p className="text-gray-600">
              {getActiveFilterCount() > 0 
                ? 'Try adjusting your filters to see more results.'
                : 'Test runs will appear here once you start running tests.'
              }
            </p>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="btn btn-primary btn-sm mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
