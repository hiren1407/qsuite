import { useState, useEffect } from "react";
import { XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";

const TestCaseForm = ({ testCase, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    categoryName: '',
    isNewCategory: false
  });
  const [categories, setCategories] = useState([]);
  const [testFiles, setTestFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchTestFiles();
    
    if (testCase) {
      setFormData({
        name: testCase.name || '',
        description: testCase.description || '',
        categoryId: testCase.category_id || '',
        categoryName: '',
        isNewCategory: false
      });
      
      // Set selected files
      const fileIds = testCase.test_case_files?.map(tcf => tcf.test_files.id) || [];
      setSelectedFileIds(fileIds);
    }
  }, [testCase]);

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

  const fetchTestFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found when fetching test files');
        return;
      }

      console.log('Fetching test files for user:', user.id);
      const { data, error } = await supabase
        .from('test_files')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching test files:', error);
        throw error;
      }
      
      console.log('Fetched test files:', data);
      setTestFiles(data || []);
    } catch (error) {
      console.error('Error fetching test files:', error);
      // Set empty array on error so UI doesn't break
      setTestFiles([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Test case name is required';
    }
    
    if (formData.isNewCategory) {
      if (!formData.categoryName.trim()) {
        newErrors.categoryName = 'Category name is required';
      }
    } else {
      if (!formData.categoryId) {
        newErrors.categoryId = 'Please select a category or create a new one';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let categoryId = formData.categoryId;
      let newCategoryCreated = false;
      
      // Create new category if needed
      if (formData.isNewCategory) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('test_categories')
          .insert({
            name: formData.categoryName.trim(),
            user_id: user.id
          })
          .select()
          .single();
        
        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
        newCategoryCreated = true;
      }

      if (testCase) {
        // Update existing test case
        const { error: updateError } = await supabase
          .from('test_cases')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            category_id: categoryId
          })
          .eq('id', testCase.id);
        
        if (updateError) throw updateError;

        // Update test case files
        // First, delete existing associations
        await supabase
          .from('test_case_files')
          .delete()
          .eq('test_case_id', testCase.id);

        // Then add new associations
        if (selectedFileIds.length > 0) {
          const fileAssociations = selectedFileIds.map(fileId => ({
            test_case_id: testCase.id,
            test_file_id: fileId
          }));

          const { error: filesError } = await supabase
            .from('test_case_files')
            .insert(fileAssociations);
          
          if (filesError) throw filesError;
        }
      } else {
        // Create new test case
        const { data: newTestCase, error: createError } = await supabase
          .from('test_cases')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim(),
            category_id: categoryId,
            user_id: user.id
          })
          .select()
          .single();
        
        if (createError) throw createError;

        // Add test case file associations
        if (selectedFileIds.length > 0) {
          const fileAssociations = selectedFileIds.map(fileId => ({
            test_case_id: newTestCase.id,
            test_file_id: fileId
          }));

          const { error: filesError } = await supabase
            .from('test_case_files')
            .insert(fileAssociations);
          
          if (filesError) throw filesError;
        }
      }

      // Pass the new category ID back to parent if one was created
      onSubmit(newCategoryCreated ? categoryId : null);
    } catch (error) {
      console.error('Error saving test case:', error);
      alert('Error saving test case: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (fileId) => {
    setSelectedFileIds(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleCategoryTypeChange = (isNewCategory) => {
    setFormData(prev => ({
      ...prev,
      isNewCategory,
      categoryId: isNewCategory ? '' : prev.categoryId,
      categoryName: isNewCategory ? prev.categoryName : ''
    }));
    setErrors(prev => ({
      ...prev,
      categoryId: '',
      categoryName: ''
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {testCase ? 'Edit Test Case' : 'Create Test Case'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Test Case Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Case Name *
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter test case name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              
              <div className="space-y-4">
                {/* Existing Category */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="categoryType"
                      className="radio radio-sm mr-2"
                      checked={!formData.isNewCategory}
                      onChange={() => handleCategoryTypeChange(false)}
                    />
                    <span className="text-sm">Select existing category</span>
                  </label>
                  
                  {!formData.isNewCategory && (
                    <select
                      className={`select select-bordered w-full ${errors.categoryId ? 'select-error' : ''}`}
                      value={formData.categoryId}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    >
                      <option value="">Choose a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* New Category */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="radio"
                      name="categoryType"
                      className="radio radio-sm mr-2"
                      checked={formData.isNewCategory}
                      onChange={() => handleCategoryTypeChange(true)}
                    />
                    <span className="text-sm">Create new category</span>
                  </label>
                  
                  {formData.isNewCategory && (
                    <input
                      type="text"
                      className={`input input-bordered w-full ${errors.categoryName ? 'input-error' : ''}`}
                      value={formData.categoryName}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
                      placeholder="Enter new category name"
                    />
                  )}
                </div>
              </div>
              
              {(errors.categoryId || errors.categoryName) && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categoryId || errors.categoryName}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter test case description"
              />
            </div>

            {/* Test Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Associated Test Files
              </label>
              
              {testFiles.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No test files available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload test files first in the Files section to attach them to this test case.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Select test files to associate with this test case:
                    </p>
                  </div>
                  {testFiles.map(file => (
                    <label
                      key={file.id}
                      className={`flex items-center p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                        selectedFileIds.includes(file.id) 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mr-3"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                      />
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">Type: {file.type}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(file.uploaded_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {file.type}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {selectedFileIds.length} of {testFiles.length} file(s) selected
                </p>
                {selectedFileIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFileIds([])}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  {testCase ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                testCase ? 'Update Test Case' : 'Create Test Case'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCaseForm;
