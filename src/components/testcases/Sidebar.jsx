import { useState, useEffect } from "react";
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";

const Sidebar = ({ 
  categories, 
  testCases, 
  selectedCategory, 
  selectedTestCase,
  onCategorySelect, 
  onTestCaseSelect,
  onDeleteTestCases,
  onCategoryCreated
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Auto-expand selected category
  useEffect(() => {
    if (selectedCategory) {
      setExpandedCategories(prev => new Set([...prev, selectedCategory.id]));
    }
  }, [selectedCategory]);

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getTestCasesForCategory = (categoryId) => {
    return testCases.filter(tc => tc.category_id === categoryId);
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      const allTestCaseIds = testCases.map(tc => tc.id);
      setSelectedItems(new Set(allTestCaseIds));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} test case(s)?`
    );
    
    if (confirmed) {
      onDeleteTestCases(Array.from(selectedItems));
      setSelectedItems(new Set());
      setSelectAll(false);
    }
  };

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

      // Call the parent callback to refresh categories
      if (onCategoryCreated) {
        onCategoryCreated();
      }

      // Reset form
      setNewCategoryName("");
      setShowCreateCategory(false);
      
      // Auto-select the new category
      onCategorySelect(data);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category: ' + error.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCancelCreate = () => {
    setNewCategoryName("");
    setShowCreateCategory(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateCategory();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  const allTestCasesCount = testCases.length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-900">Test Cases</h2>
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mr-2"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            Select All ({allTestCasesCount})
          </label>
          {selectedItems.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete ({selectedItems.size})
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* All Test Cases */}
          <div
            className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
              !selectedCategory ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
            onClick={() => onCategorySelect(null)}
          >
            <DocumentTextIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="flex-1 font-medium">All Test Cases</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
              {allTestCasesCount}
            </span>
          </div>

          {/* Categories */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Categories
              </div>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50"
                title="Create new category"
              >
                <PlusIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Create Category Form */}
            {showCreateCategory && (
              <div className="px-2 mb-3">
                <div className="bg-white border border-gray-200 rounded p-2">
                  <input
                    type="text"
                    className="input input-xs w-full mb-2"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={handleCancelCreate}
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
            
            {categories.length === 0 ? (
              <div className="px-2 py-4 text-sm text-gray-500 italic">
                No categories yet
              </div>
            ) : (
              categories.map((category) => {
                const categoryTestCases = getTestCasesForCategory(category.id);
                const isExpanded = expandedCategories.has(category.id);
                const isSelected = selectedCategory?.id === category.id;

                return (
                  <div key={category.id} className="mb-1">
                    {/* Category Header */}
                    <div
                      className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                      onClick={() => onCategorySelect(category)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category.id);
                        }}
                        className="mr-1 p-0.5 hover:bg-gray-200 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </button>
                      <FolderIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="flex-1 font-medium truncate">{category.name}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        {categoryTestCases.length}
                      </span>
                    </div>

                    {/* Test Cases in Category */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {categoryTestCases.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-gray-500 italic">
                            No test cases
                          </div>
                        ) : (
                          categoryTestCases.map((testCase) => (
                            <div
                              key={testCase.id}
                              className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                                selectedTestCase?.id === testCase.id 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'text-gray-600'
                              }`}
                              onClick={() => onTestCaseSelect(testCase)}
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs mr-2"
                                checked={selectedItems.has(testCase.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleItemSelect(testCase.id);
                                }}
                              />
                              <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="flex-1 text-sm truncate" title={testCase.name}>
                                {testCase.name}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Create Category Section */}
          {showCreateCategory && (
            <div className="mt-4 p-2 bg-gray-100 rounded">
              <div className="flex items-center">
                <input
                  type="text"
                  className="input input-bordered flex-1 mr-2"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button
                  onClick={handleCreateCategory}
                  className="btn btn-primary btn-sm"
                  disabled={creatingCategory}
                >
                  {creatingCategory ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="btn btn-ghost btn-sm ml-2"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Press Enter to create, Esc to cancel
              </div>
            </div>
          )}

          {!showCreateCategory && (
            <div className="mt-4">
              <button
                onClick={() => setShowCreateCategory(true)}
                className="btn btn-outline btn-sm w-full"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
