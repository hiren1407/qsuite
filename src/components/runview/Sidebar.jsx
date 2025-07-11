import { useState, useEffect } from "react";
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  DocumentTextIcon,
  PlayIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

const Sidebar = ({ 
  categories, 
  testCases, 
  selectedCategory, 
  selectedTestCase,
  onCategorySelect, 
  onTestCaseSelect,
  onDeleteTestCases,
  showRunActions = false,
  onRunTest,
  runningTests = new Set()
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

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

  const allTestCasesCount = testCases.length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-900">
          {showRunActions ? 'Run Tests' : 'Test Cases'}
        </h2>
        
        {!showRunActions && (
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
        )}
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
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-2">
              Categories
            </div>
            
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
                              {!showRunActions && (
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs mr-2"
                                  checked={selectedItems.has(testCase.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleItemSelect(testCase.id);
                                  }}
                                />
                              )}
                              
                              <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="flex-1 text-sm truncate" title={testCase.name}>
                                {testCase.name}
                              </span>
                              
                              {showRunActions && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRunTest(testCase.id);
                                  }}
                                  disabled={runningTests.has(testCase.id)}
                                  className="btn btn-ghost btn-xs ml-1 p-1"
                                  title="Run test"
                                >
                                  {runningTests.has(testCase.id) ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <PlayIcon className="w-3 h-3" />
                                  )}
                                </button>
                              )}
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
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
