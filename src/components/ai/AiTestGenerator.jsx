import React, { useState } from 'react';
import { 
  SparklesIcon, 
  DocumentTextIcon, 
  CheckIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabaseClient';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

const AiTestGenerator = ({ onTestsGenerated, currentFileId, onClose, isOpen = true, categories = [], selectedCategory = 'all' }) => {
  const [requirements, setRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [targetCategory, setTargetCategory] = useState(selectedCategory !== 'all' ? selectedCategory : '');

  // Modal hook
  const { modalState, hideModal, showSuccess, showError } = useModal();

  console.log('AiTestGenerator rendered with props:', { onTestsGenerated: !!onTestsGenerated, currentFileId, onClose: !!onClose, isOpen });

  // Example prompts for users
  const examplePrompts = [
    {
      title: "User Authentication",
      prompt: "User authentication system with login, registration, password reset, and email verification functionality"
    },
    {
      title: "E-commerce Checkout",
      prompt: "E-commerce checkout process including cart management, payment processing, shipping options, and order confirmation"
    },
    {
      title: "File Upload System",
      prompt: "File upload system with drag-and-drop, multiple file formats, size validation, and progress tracking"
    },
    {
      title: "Search & Filter",
      prompt: "Product search and filtering system with keyword search, category filters, sorting options, and pagination"
    },
    {
      title: "User Dashboard",
      prompt: "User dashboard with profile management, activity history, notifications, and settings configuration"
    },
    {
      title: "API Integration",
      prompt: "REST API integration with error handling, authentication, rate limiting, and data validation"
    }
  ];

  const handleGenerate = async () => {
    if (!requirements.trim()) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-tests', {
        body: {
          requirements: requirements.trim(),
          context: {
            fileId: currentFileId,
            format: 'detailed'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.success && data?.testCases) {
        setGeneratedTests(data.testCases);
        // Pre-select all tests by default
        setSelectedTests(new Set(data.testCases.map((_, index) => index)));
      } else {
        throw new Error(data?.error || 'Failed to generate tests');
      }
    } catch (error) {
      console.error('Error generating tests:', error);
      showError('Generation Failed', 'Failed to generate tests. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTestSelection = (index) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTests(newSelected);
  };

  const handleInsertSelected = async () => {
    const selectedTestsArray = generatedTests.filter((_, index) => selectedTests.has(index));
    
    if (selectedTestsArray.length === 0) {
      showError('Selection Required', 'Please select at least one test case to insert.');
      return;
    }

    try {
      // Map the test case structure to match your database schema
      const formattedTests = selectedTestsArray.map(test => ({
        title: test.name || test.title, // Handle both name and title properties
        description: test.scenarios && test.scenarios.length > 0 
          ? `${test.description}\n\nScenarios:\n${test.scenarios.map((scenario, i) => `${i + 1}. ${scenario}`).join('\n')}`
          : test.description,
        category: test.category,
        targetCategoryId: targetCategory
      }));

      console.log('Formatted tests for insertion:', formattedTests);
      
      const result = await onTestsGenerated(formattedTests);
      
      console.log('Insert result:', result);
      
      // Reset the form and close modal only on success
      setRequirements('');
      setGeneratedTests([]);
      setSelectedTests(new Set());
      
      // Show success message
      showSuccess('Tests Created', `Successfully created ${selectedTestsArray.length} test case(s)!`);
      
      // Close modal after successful insertion
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error inserting tests:', error);
      showError('Insert Failed', `Failed to insert test cases: ${error.message || 'Please try again.'}`);
      // Don't close modal on error so user can try again
    }
  };

  const handleExampleClick = (prompt) => {
    setRequirements(prompt);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">AI Test Generator</h2>
          </div>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Target Category <span className="text-info text-xs">(Optional)</span>
            </label>
            <select 
              value={targetCategory} 
              onChange={(e) => setTargetCategory(e.target.value)}
              className="select select-bordered w-full"
              disabled={isGenerating}
            >
              <option value="">AI Generated (Default)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-base-content/60 mt-1">
              Choose a category or leave blank to create an "AI Generated" category
            </div>
          </div>
          {/* Examples Section */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <LightBulbIcon className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-medium">Example Prompts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example.prompt)}
                  className="btn btn-outline btn-xs text-left p-2 h-auto whitespace-normal"
                  disabled={isGenerating}
                >
                  <div>
                    <div className="font-medium text-xs">{example.title}</div>
                    <div className="text-xs opacity-70 mt-1 line-clamp-2">{example.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Describe your requirements or features to test:
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Example: User authentication system with login, registration, and password reset functionality"
              className="textarea textarea-bordered w-full h-24"
              disabled={isGenerating}
            />
            <div className="mt-3">
              <button
                onClick={handleGenerate}
                disabled={!requirements.trim() || isGenerating}
                className="btn btn-primary gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate Test Cases
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Tests Section */}
          {generatedTests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Generated Test Cases ({generatedTests.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTests(new Set(generatedTests.map((_, i) => i)))}
                    className="btn btn-xs btn-outline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedTests(new Set())}
                    className="btn btn-xs btn-outline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {generatedTests.map((test, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTests.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-base-300 hover:border-base-400'
                    }`}
                    onClick={() => handleTestSelection(index)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedTests.has(index)
                              ? 'border-primary bg-primary text-primary-content'
                              : 'border-base-300'
                          }`}
                        >
                          {selectedTests.has(index) && (
                            <CheckIcon className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2">{test.name}</h4>
                        <p className="text-sm text-base-content/70 mb-3">{test.description}</p>
                        
                        {/* Scenarios */}
                        {test.scenarios && test.scenarios.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-base-content/80 mb-1">Test Scenarios:</h5>
                            <ul className="text-xs text-base-content/60 space-y-1">
                              {test.scenarios.slice(0, 3).map((scenario, scenarioIndex) => (
                                <li key={scenarioIndex} className="flex items-start">
                                  <span className="text-primary mr-1">•</span>
                                  {scenario}
                                </li>
                              ))}
                              {test.scenarios.length > 3 && (
                                <li className="text-base-content/40">...and {test.scenarios.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          {test.category && (
                            <span className="badge badge-outline badge-sm">{test.category}</span>
                          )}
                          {test.tags && test.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span key={tagIndex} className="badge badge-ghost badge-xs">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-base-300">
                <button
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertSelected}
                  disabled={
                    selectedTests.size === 0 || 
                    generatedTests.length === 0
                  }
                  className="btn btn-primary gap-2"
                  title={
                    generatedTests.length === 0
                      ? "Please generate test cases first"
                      : selectedTests.size === 0 
                      ? "Please select at least one test case"
                      : "Insert selected test cases"
                  }
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  Insert Selected ({selectedTests.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTestGenerator;
