import React, { useState } from 'react';
import { 
  SparklesIcon, 
  DocumentPlusIcon, 
  BeakerIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabaseClient';

const AiTestGenerator = ({ categories, onTestCasesGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState([]);
  const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Created

  const testPromptSuggestions = [
    {
      title: "E-commerce App",
      prompt: "Generate comprehensive test cases for an e-commerce mobile app including user registration, product browsing, cart management, checkout process, payment integration, order tracking, and user profile management."
    },
    {
      title: "Banking Application",
      prompt: "Create test cases for a secure banking application covering account login with 2FA, balance inquiry, fund transfers, bill payments, transaction history, account settings, and security features."
    },
    {
      title: "Social Media Platform",
      prompt: "Generate test cases for a social media platform including user registration, profile creation, post creation/editing, commenting, liking, following users, messaging, and privacy settings."
    },
    {
      title: "File Upload System",
      prompt: "Create test cases for a file upload and management system covering file selection, upload progress, file type validation, size limits, batch uploads, file preview, download, and deletion."
    },
    {
      title: "API Testing Suite",
      prompt: "Generate test cases for REST API testing including authentication endpoints, CRUD operations, error handling, rate limiting, data validation, response formats, and security testing."
    },
    {
      title: "Video Streaming App",
      prompt: "Create test cases for a video streaming application covering user authentication, video browsing, playback controls, quality settings, search functionality, playlists, and offline downloads."
    }
  ];

  const generateAdvancedTestCases = (prompt) => {
    const promptLower = prompt.toLowerCase();
    
    // Enhanced AI logic with more sophisticated pattern matching
    const patterns = {
      ecommerce: {
        keywords: ['shop', 'cart', 'checkout', 'payment', 'order', 'product', 'purchase', 'ecommerce', 'store'],
        tests: [
          {
            name: 'User Registration & Authentication',
            description: 'Comprehensive testing of user account creation and authentication flows',
            priority: 'High',
            scenarios: [
              'Valid email registration with email verification',
              'Password strength validation and requirements',
              'Social media login integration (Google, Facebook)',
              'Forgot password flow and email reset',
              'Account lockout after failed login attempts',
              'Remember me functionality',
              'Session timeout handling'
            ]
          },
          {
            name: 'Product Catalog & Search',
            description: 'Testing product browsing, searching, and filtering capabilities',
            priority: 'High',
            scenarios: [
              'Product search with keywords and filters',
              'Category-based product browsing',
              'Product details page functionality',
              'Product image gallery and zoom',
              'Product reviews and ratings display',
              'Out of stock product handling',
              'Product comparison feature'
            ]
          },
          {
            name: 'Shopping Cart Management',
            description: 'Testing cart operations and persistence',
            priority: 'High',
            scenarios: [
              'Add products to cart with different quantities',
              'Update cart item quantities',
              'Remove items from cart',
              'Cart persistence across sessions',
              'Guest cart vs logged-in user cart',
              'Cart total calculation with taxes',
              'Apply discount codes and coupons'
            ]
          },
          {
            name: 'Checkout Process',
            description: 'End-to-end checkout flow testing',
            priority: 'Critical',
            scenarios: [
              'Guest checkout without registration',
              'Logged-in user checkout with saved addresses',
              'Shipping address validation',
              'Multiple shipping options selection',
              'Payment method selection and validation',
              'Order summary review before payment',
              'Order confirmation and receipt generation'
            ]
          },
          {
            name: 'Payment Integration',
            description: 'Payment processing and security testing',
            priority: 'Critical',
            scenarios: [
              'Credit/debit card payment processing',
              'PayPal and digital wallet integration',
              'Payment failure handling and retry',
              'Secure payment data transmission',
              'Payment confirmation and receipt',
              'Refund processing workflow',
              'Fraud detection and prevention'
            ]
          }
        ]
      },
      banking: {
        keywords: ['bank', 'account', 'balance', 'transfer', 'payment', 'transaction', 'financial'],
        tests: [
          {
            name: 'Secure Authentication',
            description: 'Multi-factor authentication and security testing',
            priority: 'Critical',
            scenarios: [
              'Username/password login validation',
              'Two-factor authentication (SMS/Email/App)',
              'Biometric authentication (fingerprint/face)',
              'Account lockout after failed attempts',
              'Security questions verification',
              'Device registration and trusted devices',
              'Session timeout and automatic logout'
            ]
          },
          {
            name: 'Account Management',
            description: 'Account information and settings management',
            priority: 'High',
            scenarios: [
              'View account balance and details',
              'Account statement generation and download',
              'Personal information update',
              'Contact information modification',
              'Password and PIN changes',
              'Account preferences and settings',
              'Account closure procedures'
            ]
          },
          {
            name: 'Fund Transfers',
            description: 'Money transfer functionality testing',
            priority: 'Critical',
            scenarios: [
              'Internal account transfers',
              'External bank transfers (ACH)',
              'Wire transfer functionality',
              'International money transfers',
              'Transfer limits and validation',
              'Recurring transfer setup',
              'Transfer confirmation and receipts'
            ]
          },
          {
            name: 'Bill Payment System',
            description: 'Bill payment and scheduling features',
            priority: 'High',
            scenarios: [
              'Add new payees and billing accounts',
              'One-time bill payment processing',
              'Recurring payment setup and management',
              'Payment scheduling and future dating',
              'Payment history and tracking',
              'Failed payment handling and notifications',
              'Payment confirmation and receipts'
            ]
          }
        ]
      },
      upload: {
        keywords: ['upload', 'file', 'attach', 'document', 'image', 'download'],
        tests: [
          {
            name: 'File Upload Functionality',
            description: 'Core file upload feature testing',
            priority: 'High',
            scenarios: [
              'Single file upload with progress indicator',
              'Multiple file upload (batch processing)',
              'Drag and drop file selection',
              'File browse dialog functionality',
              'Upload cancellation and resume',
              'Large file upload handling',
              'Upload speed and performance testing'
            ]
          },
          {
            name: 'File Validation',
            description: 'File type and size validation testing',
            priority: 'High',
            scenarios: [
              'Supported file format validation',
              'File size limit enforcement',
              'Malicious file detection and blocking',
              'Empty file upload prevention',
              'Duplicate file handling',
              'File name character validation',
              'Virus scanning integration'
            ]
          },
          {
            name: 'File Management',
            description: 'File organization and manipulation features',
            priority: 'Medium',
            scenarios: [
              'File listing and sorting options',
              'File search and filtering',
              'File rename functionality',
              'File deletion and trash management',
              'Folder creation and organization',
              'File sharing and permissions',
              'File version control and history'
            ]
          }
        ]
      },
      api: {
        keywords: ['api', 'endpoint', 'rest', 'graphql', 'service', 'request', 'response'],
        tests: [
          {
            name: 'Authentication & Authorization',
            description: 'API security and access control testing',
            priority: 'Critical',
            scenarios: [
              'JWT token authentication flow',
              'API key validation and management',
              'OAuth 2.0 implementation testing',
              'Role-based access control (RBAC)',
              'Permission-based endpoint access',
              'Token expiration and refresh',
              'Unauthorized access prevention'
            ]
          },
          {
            name: 'CRUD Operations',
            description: 'Create, Read, Update, Delete functionality testing',
            priority: 'High',
            scenarios: [
              'Create new resources with validation',
              'Retrieve single and multiple resources',
              'Update existing resources (PUT/PATCH)',
              'Delete resources and cascade effects',
              'Bulk operations and batch processing',
              'Data consistency and integrity',
              'Concurrent operation handling'
            ]
          },
          {
            name: 'Error Handling',
            description: 'API error response and recovery testing',
            priority: 'High',
            scenarios: [
              'HTTP status code accuracy',
              'Error message clarity and detail',
              'Input validation error responses',
              'Rate limiting and throttling',
              'Server error (5xx) handling',
              'Timeout and network error handling',
              'Graceful degradation testing'
            ]
          }
        ]
      }
    };

    // Detect the most relevant pattern
    let bestMatch = { pattern: 'general', score: 0 };
    
    for (const [patternName, patternData] of Object.entries(patterns)) {
      const matches = patternData.keywords.filter(keyword => 
        promptLower.includes(keyword)
      ).length;
      
      if (matches > bestMatch.score) {
        bestMatch = { pattern: patternName, score: matches };
      }
    }

    // Generate test cases based on the best matching pattern
    if (bestMatch.score > 0 && patterns[bestMatch.pattern]) {
      return patterns[bestMatch.pattern].tests;
    }

    // Fallback general test cases
    return [
      {
        name: 'Functional Testing',
        description: 'Core functionality validation based on requirements',
        priority: 'High',
        scenarios: [
          'Test main user workflows and use cases',
          'Verify expected outputs for given inputs',
          'Test boundary conditions and edge cases',
          'Validate business rule implementation',
          'Test user interface interactions',
          'Verify data persistence and retrieval'
        ]
      },
      {
        name: 'Error Handling',
        description: 'Error scenarios and exception handling testing',
        priority: 'Medium',
        scenarios: [
          'Test invalid input handling',
          'Verify error message accuracy',
          'Test system behavior under failure conditions',
          'Validate graceful error recovery',
          'Test timeout and network error scenarios',
          'Verify logging and error reporting'
        ]
      },
      {
        name: 'Performance Testing',
        description: 'System performance and responsiveness validation',
        priority: 'Medium',
        scenarios: [
          'Load testing with expected user volume',
          'Response time measurement',
          'Memory usage and resource consumption',
          'Concurrent user simulation',
          'Database query performance',
          'API endpoint response times'
        ]
      }
    ];
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const tests = generateAdvancedTestCases(prompt);
      setGeneratedTests(tests);
      setStep(2);
      setGenerating(false);
    }, 2000);
  };

  const handleCreateTestCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let categoryId = selectedCategory;

      // Create new category if needed
      if (useNewCategory && newCategoryName.trim()) {
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .insert([{ name: newCategoryName.trim(), user_id: user.id }])
          .select()
          .single();

        if (categoryError) throw categoryError;
        categoryId = category.id;
      }

      // Create test cases
      const testCasesToCreate = generatedTests.map(test => ({
        name: test.name,
        description: `${test.description}\n\n**Priority:** ${test.priority}\n\n**Test Scenarios:**\n${test.scenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        category_id: categoryId,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('test_cases')
        .insert(testCasesToCreate);

      if (error) throw error;

      setStep(3);
      if (onTestCasesGenerated) {
        onTestCasesGenerated();
      }

    } catch (error) {
      console.error('Error creating test cases:', error);
      alert('Failed to create test cases. Please try again.');
    }
  };

  const useSuggestion = (suggestion) => {
    setPrompt(suggestion.prompt);
  };

  if (step === 3) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-base-100 rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <BeakerIcon className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-success">Test Cases Created!</h3>
          <p className="text-base-content/70 mb-6">
            Successfully generated {generatedTests.length} AI-powered test cases. 
            You can find them in your Test Cases section.
          </p>
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-primary text-primary-content p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">AI Test Case Generator</h2>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-circle">
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <>
              {/* Prompt Input */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text text-lg font-semibold">Describe what you want to test</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Generate test cases for an e-commerce app with user registration, product browsing, cart management, and checkout process..."
                  className="textarea textarea-bordered w-full h-32 text-base"
                />
              </div>

              {/* Suggestions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BoltIcon className="w-5 h-5 mr-2" />
                  Quick Start Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testPromptSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      <h4 className="font-medium text-primary">{suggestion.title}</h4>
                      <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                        {suggestion.prompt.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  className="btn btn-primary btn-lg"
                >
                  {generating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generate Test Cases
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Generated Test Cases Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Generated Test Cases ({generatedTests.length})</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedTests.map((test, index) => (
                    <div key={index} className="border border-base-300 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-primary">{test.name}</h4>
                        <span className={`badge ${test.priority === 'Critical' ? 'badge-error' : test.priority === 'High' ? 'badge-warning' : 'badge-info'}`}>
                          {test.priority}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 mb-3">{test.description}</p>
                      <div className="collapse collapse-arrow bg-base-50">
                        <input type="checkbox" />
                        <div className="collapse-title text-sm font-medium">
                          View Test Scenarios ({test.scenarios.length})
                        </div>
                        <div className="collapse-content">
                          <ul className="list-decimal list-inside space-y-1 text-sm">
                            {test.scenarios.map((scenario, i) => (
                              <li key={i}>{scenario}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Choose Category</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="categoryChoice"
                        checked={!useNewCategory}
                        onChange={() => setUseNewCategory(false)}
                        className="radio radio-primary"
                      />
                      <span>Use existing category</span>
                    </label>
                    {!useNewCategory && (
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="select select-bordered w-full mt-2"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="categoryChoice"
                        checked={useNewCategory}
                        onChange={() => setUseNewCategory(true)}
                        className="radio radio-primary"
                      />
                      <span>Create new category</span>
                    </label>
                    {useNewCategory && (
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="input input-bordered w-full mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleCreateTestCases}
                  disabled={(!selectedCategory && !useNewCategory) || (useNewCategory && !newCategoryName.trim())}
                  className="btn btn-primary"
                >
                  <DocumentPlusIcon className="w-5 h-5" />
                  Create {generatedTests.length} Test Cases
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTestGenerator;
