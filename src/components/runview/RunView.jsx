import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PlayIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  FolderIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";
import Sidebar from "./Sidebar";
import Modal from "../common/Modal";
import { useModal } from "../../hooks/useModal";

const RunView = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [testRuns, setTestRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(new Set());
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Modal hook for replacing alerts and confirms
  const { modalState, hideModal, showError, showSuccess } = useModal();

  useEffect(() => {
    fetchCategories();
    fetchTestCases();
    fetchTestRuns();
  }, []);

  // Auto-update selectAll when filtered test cases change
  useEffect(() => {
    const visibleTestCases = getFilteredTestCases();
    const allVisible = visibleTestCases.map(tc => tc.id);
    const allSelected = allVisible.length > 0 && allVisible.every(id => selectedTestCases.includes(id));
    setSelectAll(allSelected);
  }, [testCases, selectedCategory, searchText, selectedTestCases]);

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
          test_categories(id, name),
          test_case_files(
            id,
            test_files(id, name, type)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTestCases(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching test cases:', error);
      setLoading(false);
    }
  };

  const fetchTestRuns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if test_runs table exists and fetch data
      const { data, error } = await supabase
        .from('test_runs')
        .select(`
          *,
          test_cases(name, test_categories(name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, just set empty array
        console.log('Test runs table not available yet:', error);
        setTestRuns([]);
        return;
      }
      
      setTestRuns(data || []);
    } catch (error) {
      console.error('Error fetching test runs:', error);
      setTestRuns([]);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedTestCase(null);
    setSelectedTestCases([]);
    setSelectAll(false);
  };

  const handleTestCaseSelect = (testCase) => {
    setSelectedTestCase(testCase);
  };

  const handleEditTestCase = (testCase) => {
    // Navigate to test cases component with the test case ID
    navigate('/dashboard/test-cases', { 
      state: { 
        editTestCaseId: testCase.id,
        categoryId: testCase.category_id 
      } 
    });
  };

  // Selection management
  const handleSelectTestCase = (testCaseId) => {
    setSelectedTestCases(prev => {
      const newSelected = prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId];
      
      // Auto-update selectAll checkbox based on whether all visible test cases are selected
      const visibleTestCases = getFilteredTestCases();
      const allVisible = visibleTestCases.map(tc => tc.id);
      const allSelected = allVisible.length > 0 && allVisible.every(id => newSelected.includes(id));
      setSelectAll(allSelected);
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const visibleTestCases = getFilteredTestCases();
    if (selectAll) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(visibleTestCases.map(tc => tc.id));
    }
    setSelectAll(!selectAll);
  };

  const handleRunSelectedTestCases = async () => {
    if (selectedTestCases.length === 0) return;
    
    // Run all selected test cases directly without confirmation
    for (const testCaseId of selectedTestCases) {
      await handleRunTest(testCaseId);
      // Add a small delay between test executions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSelectedTestCases([]);
    setSelectAll(false);
  };

  const handleRunTest = async (testCaseId) => {
    setRunningTests(prev => new Set([...prev, testCaseId]));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startTime = new Date().toISOString();
      
      // Create initial test run record in database
      const { data: testRun, error: createError } = await supabase
        .from('test_runs')
        .insert({
          test_case_id: testCaseId,
          user_id: user.id,
          status: 'running',
          started_at: startTime,
          created_at: startTime
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating test run:', createError);
        throw createError;
      }

      console.log(`Running test case ${testCaseId}...`);
      
      // Simulate test execution (replace with actual test execution logic)
      setTimeout(async () => {
        const success = Math.random() > 0.3; // 70% success rate for demo
        const endTime = new Date().toISOString();
        const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
        
        // Update test run with results
        const { error: updateError } = await supabase
          .from('test_runs')
          .update({
            status: success ? 'passed' : 'failed',
            completed_at: endTime,
            duration: duration,
            result: {
              success: success,
              message: success 
                ? 'All tests completed successfully.' 
                : 'Some tests failed. Check the logs for details.'
            }
          })
          .eq('id', testRun.id);

        if (updateError) {
          console.error('Error updating test run:', updateError);
        }

        console.log(`Test ${testCaseId} ${success ? 'passed' : 'failed'}`);
        
        setRunningTests(prev => {
          const newSet = new Set(prev);
          newSet.delete(testCaseId);
          return newSet;
        });

        // Show a notification or result
        if (success) {
          showSuccess('Test Passed', 'All tests completed successfully.');
        } else {
          showError('Test Failed', 'Some tests failed. Check the logs for details.');
        }
        // Refresh data to show updated test runs
        fetchTestRuns();
      }, 3000 + Math.random() * 2000); // Random delay between 3-5 seconds

    } catch (error) {
      console.error('Error running test:', error);
      showError('Test Error', 'Error running test: ' + error.message);
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testCaseId);
        return newSet;
      });
    }
  };

  const getFilteredTestCases = () => {
    let filtered = selectedCategory === 'all' ? testCases : testCases.filter(tc => tc.category_id === selectedCategory);
    
    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(tc =>
        tc.name.toLowerCase().includes(searchLower) ||
        tc.description?.toLowerCase().includes(searchLower) ||
        getCategoryById(tc.category_id)?.name.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  const getTestRunsForTestCase = (testCaseId) => {
    return testRuns.filter(run => run.test_case_id === testCaseId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'passed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'running':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'passed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const visibleTestCases = getFilteredTestCases();
  const selectedCategoryName = selectedCategory === 'all' ? 'All Test Cases' : getCategoryById(selectedCategory)?.name;

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Run Tests</h2>
            </div>
            
            {/* Select All Section */}
            {visibleTestCases.length > 0 && (
              <div className="mb-3">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mr-2"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  Select All ({visibleTestCases.length} test cases)
                </label>
              </div>
            )}
            
            {/* Bulk Actions */}
            {selectedTestCases.length > 0 && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-2">
                <span className="text-sm text-green-800">
                  {selectedTestCases.length} selected
                </span>
                <button
                  onClick={handleRunSelectedTestCases}
                  className="btn btn-ghost btn-xs text-green-600 hover:bg-green-50"
                  disabled={runningTests.size > 0}
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  Run
                </button>
              </div>
            )}
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* All Test Cases */}
            <div
              className={`flex items-center justify-between p-3 rounded cursor-pointer mb-2 ${
                selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleCategorySelect('all')}
            >
              <div className="flex items-center min-w-0 flex-1">
                <DocumentTextIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium truncate">All Test Cases</span>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded ml-2 flex-shrink-0">
                {testCases.length}
              </span>
            </div>

            {/* Categories Header */}
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Categories
              </span>
            </div>

            {/* Categories List */}
            {categories.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No categories yet
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer mb-1 ${
                    selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <FolderIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="font-medium truncate">{category.name}</span>
                  </div>
                  
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded flex-shrink-0">
                    {testCases.filter(tc => tc.category_id === category.id).length}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Side - Header and Table/Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedCategoryName}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {visibleTestCases.length} test case(s) available for execution
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {selectedTestCases.length > 0 && (
                    <button
                      onClick={handleRunSelectedTestCases}
                      className="btn btn-success"
                      disabled={runningTests.size > 0}
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Run Selected ({selectedTestCases.length})
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test cases..."
                  className="input input-bordered w-full pl-10"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            {/* Table/Content Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-white border-r border-gray-200">
              {selectedTestCase ? (
                // Test Case Detail View
                <div className="max-w-6xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <button
                        onClick={() => setSelectedTestCase(null)}
                        className="btn btn-ghost btn-sm mb-2"
                      >
                        ← Back to list
                      </button>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedTestCase.name}
                      </h2>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRunTest(selectedTestCase.id)}
                        disabled={runningTests.has(selectedTestCase.id)}
                        className="btn btn-success btn-sm"
                      >
                        {runningTests.has(selectedTestCase.id) ? (
                          <>
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            Running...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Run Test
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Test Case Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Category</label>
                          <p className="text-gray-900">{selectedTestCase.test_categories?.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created</label>
                          <p className="text-gray-900">
                            {new Date(selectedTestCase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Description</h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedTestCase.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Test Execution Demo */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Test Execution Demo</h4>
                      <p className="text-sm text-blue-800">
                        This is a demonstration of test execution. When you click "Run Test", it simulates running the test case 
                        with the associated test files. In a real implementation, this would execute your actual test scripts.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Table View
                <div>
                  {visibleTestCases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                        <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th className="w-12">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={selectAll}
                                onChange={handleSelectAll}
                              />
                            </th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Files</th>
                            <th className="w-40">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleTestCases.map((testCase) => {
                            const recentRuns = getTestRunsForTestCase(testCase.id).slice(0, 1);
                            const isRunning = runningTests.has(testCase.id);
                            
                            return (
                              <tr
                                key={testCase.id}
                                className={`hover:bg-gray-50 cursor-pointer ${
                                  selectedTestCases.includes(testCase.id) ? 'bg-blue-50' : ''
                                }`}
                                onClick={(e) => {
                                  // Don't trigger row click if clicking on checkbox or action buttons
                                  if (e.target.type === 'checkbox' || e.target.closest('button')) {
                                    return;
                                  }
                                  setSelectedTestCase(testCase);
                                }}
                              >
                                <td onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedTestCases.includes(testCase.id)}
                                    onChange={() => handleSelectTestCase(testCase.id)}
                                  />
                                </td>
                                <td>
                                  <div className="font-medium text-gray-900">
                                    {testCase.name}
                                  </div>
                                </td>
                                <td>
                                  <span className="badge badge-outline badge-lg text-xs">
                                    {testCase.test_categories?.name}
                                  </span>
                                </td>
                                <td>
                                  <div className="max-w-xs">
                                    <p className="text-sm text-gray-600 truncate">
                                      {testCase.description || 'No description'}
                                    </p>
                                  </div>
                                </td>
                                <td>
                                  <div className="flex items-center">
                                    <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-600">
                                      {testCase.test_case_files?.length || 0}
                                    </span>
                                  </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleRunTest(testCase.id)}
                                      disabled={isRunning}
                                      className="btn btn-ghost btn-xs text-green-600 hover:bg-green-50"
                                      title="Run test"
                                    >
                                      {isRunning ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                      ) : (
                                        <PlayIcon className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setSelectedTestCase(testCase)}
                                      className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50"
                                      title="View details"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditTestCase(testCase)}
                                      className="btn btn-ghost btn-xs text-orange-600 hover:bg-orange-50"
                                      title="Edit test case"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <EyeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No test cases found
                      </h3>
                      <p className="text-gray-600">
                        {selectedCategory === 'all'
                          ? 'Create test cases first to run them here.'
                          : `No test cases in "${selectedCategoryName}" category.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - iPhone Simulator */}
          <div className="w-80 p-4 bg-gray-50">
            {/* iPhone Simulator */}
            <div className="bg-base-100 rounded-lg p-6 border border-base-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                <h3 className="text-lg font-semibold">Simulator</h3>
              </div>
              
              <div className="relative">
                {/* iPhone Frame */}
                <div className="w-full max-w-[280px] mx-auto">
                  <div className="relative bg-black rounded-[3rem] p-4 shadow-2xl">
                    {/* Screen */}
                    <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19.5]">
                      {/* Status Bar */}
                      <div className="bg-gray-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                        <span>9:41</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-2 border border-white rounded-sm">
                            <div className="w-3 h-1 bg-white rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* App Content */}
                      <div className="p-4 h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-bold text-gray-800">QSuite Mobile</h4>
                          <p className="text-sm text-gray-600">Test Runner</p>
                        </div>
                        
                        {selectedTestCase ? (
                          <div className="flex-1 flex flex-col">
                            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                              <h5 className="font-medium text-sm text-gray-800 mb-1">
                                {selectedTestCase.name}
                              </h5>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {selectedTestCase.description}
                              </p>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {getTestRunsForTestCase(selectedTestCase.id).slice(0, 3).map((run, index) => (
                                <div key={run.id} className="bg-white rounded-md p-2 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">
                                      Run #{index + 1}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      run.status === 'passed' ? 'bg-green-100 text-green-800' :
                                      run.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {run.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <button className="bg-blue-500 text-white rounded-lg p-3 text-sm font-medium">
                              Run Test
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-xs text-gray-500">Select a test case</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Mobile app simulation for selected test case
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for error, success messages and confirmations */}
      <Modal 
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
};

export default RunView;
