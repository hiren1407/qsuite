import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  FolderPlusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";
import TestCaseForm from "./TestCaseForm";

const TestCases = () => {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [showTestCaseForm, setShowTestCaseForm] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Category creation/editing states
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchTestCases();
  }, []);

  // Auto-update selectAll when filtered test cases change
  useEffect(() => {
    const visibleTestCases = getFilteredTestCases();
    const allVisible = visibleTestCases.map(tc => tc.id);
    const allSelected = allVisible.length > 0 && allVisible.every(id => selectedTestCases.includes(id));
    setSelectAll(allSelected);
  }, [testCases, selectedCategory, searchText, selectedTestCases]);

  // Handle navigation from RunView for editing
  useEffect(() => {
    if (location.state?.editTestCaseId) {
      const testCaseId = location.state.editTestCaseId;
      const categoryId = location.state.categoryId;
      
      // Wait for test cases to be loaded
      if (testCases.length > 0) {
        const testCaseToEdit = testCases.find(tc => tc.id === testCaseId);
        if (testCaseToEdit) {
          // Set the category if specified
          if (categoryId) {
            setSelectedCategory(categoryId);
          }
          
          // Open the edit form
          setEditingTestCase(testCaseToEdit);
          setShowTestCaseForm(true);
          
          // Clear the navigation state
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [location.state, testCases]);

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

  // Category management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setCreatingCategory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('test_categories')
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setNewCategoryName("");
      setShowCreateCategory(false);
      await fetchCategories();
      setSelectedCategory(data.id);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category: ' + error.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleUpdateCategory = async (categoryId, newName) => {
    try {
      const { error } = await supabase
        .from('test_categories')
        .update({ name: newName.trim() })
        .eq('id', categoryId);

      if (error) throw error;

      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryTestCases = testCases.filter(tc => tc.category_id === categoryId);
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category?.name}"? This will also delete ${categoryTestCases.length} test case(s) in this category.`
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('test_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      if (selectedCategory === categoryId) {
        setSelectedCategory('all');
      }
      await fetchCategories();
      await fetchTestCases();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + error.message);
    }
  };

  // Test case management functions
  const handleCreateTestCase = () => {
    setEditingTestCase(null);
    setShowTestCaseForm(true);
  };

  const handleEditTestCase = (testCase) => {
    setEditingTestCase(testCase);
    setShowTestCaseForm(true);
  };

  const handleTestCaseFormClose = () => {
    setShowTestCaseForm(false);
    setEditingTestCase(null);
  };

  const handleTestCaseFormSubmit = async (newCategoryId = null) => {
    await fetchTestCases();
    await fetchCategories(); // Also refresh categories in case a new one was created
    
    // If a new category was created, automatically select it
    if (newCategoryId) {
      setSelectedCategory(newCategoryId);
    }
    
    setShowTestCaseForm(false);
    setEditingTestCase(null);
  };

  const handleDeleteTestCase = async (testCaseId) => {
    const confirmed = window.confirm('Are you sure you want to delete this test case?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('test_cases')
        .delete()
        .eq('id', testCaseId);

      if (error) throw error;

      if (selectedTestCase?.id === testCaseId) {
        setSelectedTestCase(null);
      }
      await fetchTestCases();
    } catch (error) {
      console.error('Error deleting test case:', error);
      alert('Error deleting test case: ' + error.message);
    }
  };

  const handleDeleteSelectedTestCases = async () => {
    if (selectedTestCases.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTestCases.length} test case(s)?`
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('test_cases')
        .delete()
        .in('id', selectedTestCases);

      if (error) throw error;

      setSelectedTestCases([]);
      setSelectAll(false);
      setSelectedTestCase(null);
      await fetchTestCases();
    } catch (error) {
      console.error('Error deleting test cases:', error);
      alert('Error deleting test cases: ' + error.message);
    }
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

  // Utility functions
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

  const getTestCaseCountByCategory = (categoryId) => {
    return testCases.filter(tc => tc.category_id === categoryId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const visibleTestCases = getFilteredTestCases();
  const selectedCategoryName = selectedCategory === 'all' ? 'All Categories' : getCategoryById(selectedCategory)?.name;

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Test Cases</h2>
              <button
                onClick={handleCreateTestCase}
                className="btn  btn-primary btn-sm"
                title="Create test case"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Bulk Actions */}
            {selectedTestCases.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-2">
                <span className="text-sm text-blue-800">
                  {selectedTestCases.length} selected
                </span>
                <button
                  onClick={handleDeleteSelectedTestCases}
                  className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* All Categories */}
            <div
              className={`flex items-center justify-between p-3 rounded cursor-pointer mb-2 ${
                selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory('all')}
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
              <button
                onClick={() => setShowCreateCategory(true)}
                className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50"
                title="Create category"
              >
                <FolderPlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Create Category Form */}
            {showCreateCategory && (
              <div className="mb-3 px-3">
                <div className="bg-white border border-gray-200 rounded p-3">
                  <input
                    type="text"
                    className="input input-sm w-full mb-2"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCategory();
                      if (e.key === 'Escape') {
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowCreateCategory(false);
                        setNewCategoryName("");
                      }}
                      className="btn btn-ghost btn-xs"
                      disabled={creatingCategory}
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleCreateCategory}
                      className="btn btn-primary btn-xs"
                      disabled={!newCategoryName.trim() || creatingCategory}
                    >
                      {creatingCategory ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <CheckIcon className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories List */}
            {categories.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No categories yet
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className={`group flex items-center justify-between p-3 rounded cursor-pointer mb-1 ${
                    selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="flex items-center min-w-0 flex-1"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <FolderIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {editingCategory === category.id ? (
                      <input
                        type="text"
                        className="input input-xs flex-1 mr-2"
                        defaultValue={category.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() !== category.name) {
                            handleUpdateCategory(category.id, e.target.value);
                          } else {
                            setEditingCategory(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCategory(category.id, e.target.value);
                          }
                          if (e.key === 'Escape') {
                            setEditingCategory(null);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-medium truncate">{category.name}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {getTestCaseCountByCategory(category.id)}
                    </span>
                    
                    <div className="dropdown dropdown-end">
                      <button
                        tabIndex={0}
                        className="btn btn-ghost btn-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EllipsisVerticalIcon className="w-4 h-4" />
                      </button>
                      <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(category.id);
                            }}
                            className="text-sm"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            className="text-sm text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategoryName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {visibleTestCases.length} test case(s)
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {visibleTestCases.length > 0 && (
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    Select All
                  </label>
                )}
                
                <button
                  onClick={handleCreateTestCase}
                  className="btn btn-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Test Case
                </button>
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

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTestCase ? (
              // Test Case Detail View
              <div className="max-w-4xl">
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
                      onClick={() => handleEditTestCase(selectedTestCase)}
                      className="btn btn-outline btn-sm"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTestCase(selectedTestCase.id)}
                      className="btn btn-error btn-sm"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete
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

                  {/* Associated Test Files */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Associated Test Files</h3>
                    <div className="bg-white border border-gray-200 rounded-lg">
                      {selectedTestCase.test_case_files?.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {selectedTestCase.test_case_files.map((tcf) => (
                            <div key={tcf.id} className="p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {tcf.test_files.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Type: {tcf.test_files.type}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {tcf.test_files.type}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No test files associated with this test case.</p>
                          <p className="text-sm mt-2">
                            Edit this test case to attach test files.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Table View
              <div>
                {visibleTestCases.length > 0 ? (
                  <div className="overflow-x-auto">
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
                          <th>Created</th>
                          <th className="w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTestCases.map((testCase) => (
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
                              <span className="badge badge-outline badge-sm">
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
                            <td>
                              <span className="text-sm text-gray-500">
                                {new Date(testCase.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEditTestCase(testCase)}
                                  className="btn btn-ghost btn-xs"
                                  title="Edit test case"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTestCase(testCase.id)}
                                  className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                                  title="Delete test case"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No test cases found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {selectedCategory === 'all'
                        ? 'Get started by creating your first test case.'
                        : `No test cases in "${selectedCategoryName}" category.`
                      }
                    </p>
                    <button
                      onClick={handleCreateTestCase}
                      className="btn btn-primary"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Create Test Case
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Case Form Modal */}
      {showTestCaseForm && (
        <TestCaseForm
          testCase={editingTestCase}
          onClose={handleTestCaseFormClose}
          onSubmit={handleTestCaseFormSubmit}
        />
      )}
    </div>
  );
};

export default TestCases;
