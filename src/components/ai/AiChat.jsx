import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  DocumentPlusIcon,
  LightBulbIcon,
  XMarkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabaseClient';

const AiChat = ({ onTestCaseGenerated, categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hi! I'm your AI testing assistant. I can help you:

🔹 **Generate test cases** from descriptions
🔹 **Suggest test scenarios** for your apps
🔹 **Optimize existing tests**
🔹 **Provide testing best practices**

Try asking me something like:
• "Generate test cases for a login form"
• "Create tests for an e-commerce checkout"
• "What scenarios should I test for a file upload feature?"`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateTestCases = (userInput) => {
    // AI-powered test case generation logic
    const input = userInput.toLowerCase();
    
    // Analyze input for context
    const contexts = {
      login: ['login', 'sign in', 'authentication', 'auth', 'credentials'],
      ecommerce: ['shop', 'cart', 'checkout', 'payment', 'order', 'purchase', 'buy'],
      form: ['form', 'input', 'validation', 'submit', 'field'],
      upload: ['upload', 'file', 'attach', 'document', 'image'],
      api: ['api', 'endpoint', 'request', 'response', 'service'],
      ui: ['button', 'click', 'interface', 'navigation', 'menu'],
      performance: ['performance', 'speed', 'load', 'response time'],
      security: ['security', 'vulnerability', 'injection', 'xss', 'csrf']
    };

    let detectedContext = 'general';
    let contextScore = 0;
    
    for (const [context, keywords] of Object.entries(contexts)) {
      const matches = keywords.filter(keyword => input.includes(keyword)).length;
      if (matches > contextScore) {
        contextScore = matches;
        detectedContext = context;
      }
    }

    // Generate test cases based on detected context
    const testCaseTemplates = {
      login: [
        {
          name: 'Valid Login Test',
          description: 'Test successful login with valid credentials',
          scenarios: [
            'Enter valid email and password',
            'Click login button',
            'Verify user is redirected to dashboard',
            'Verify user session is established'
          ]
        },
        {
          name: 'Invalid Credentials Test',
          description: 'Test login failure with invalid credentials',
          scenarios: [
            'Enter invalid email or password',
            'Click login button',
            'Verify error message is displayed',
            'Verify user remains on login page'
          ]
        },
        {
          name: 'Empty Fields Test',
          description: 'Test validation for empty input fields',
          scenarios: [
            'Leave email field empty',
            'Leave password field empty',
            'Click login button',
            'Verify validation messages appear'
          ]
        }
      ],
      ecommerce: [
        {
          name: 'Add to Cart Test',
          description: 'Test adding products to shopping cart',
          scenarios: [
            'Browse product catalog',
            'Select product',
            'Choose quantity and options',
            'Click add to cart',
            'Verify item appears in cart'
          ]
        },
        {
          name: 'Checkout Process Test',
          description: 'Test complete checkout workflow',
          scenarios: [
            'Add items to cart',
            'Proceed to checkout',
            'Enter shipping information',
            'Select payment method',
            'Complete order and verify confirmation'
          ]
        }
      ],
      form: [
        {
          name: 'Form Validation Test',
          description: 'Test form field validation rules',
          scenarios: [
            'Test required field validation',
            'Test email format validation',
            'Test character limits',
            'Test special character handling'
          ]
        },
        {
          name: 'Form Submission Test',
          description: 'Test successful form submission',
          scenarios: [
            'Fill all required fields',
            'Submit form',
            'Verify success message',
            'Verify data is saved'
          ]
        }
      ],
      upload: [
        {
          name: 'File Upload Test',
          description: 'Test file upload functionality',
          scenarios: [
            'Select valid file',
            'Verify file size limits',
            'Upload file',
            'Verify upload progress',
            'Verify file appears in list'
          ]
        },
        {
          name: 'Invalid File Test',
          description: 'Test upload restrictions',
          scenarios: [
            'Try uploading oversized file',
            'Try uploading invalid file type',
            'Verify appropriate error messages',
            'Verify file is not uploaded'
          ]
        }
      ],
      general: [
        {
          name: 'Functional Test',
          description: 'Test core functionality based on your description',
          scenarios: [
            'Test main user workflow',
            'Verify expected outcomes',
            'Test edge cases',
            'Verify error handling'
          ]
        }
      ]
    };

    return testCaseTemplates[detectedContext] || testCaseTemplates.general;
  };

  const getAiResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Check for test case generation requests
    if (input.includes('generate') || input.includes('create') || input.includes('test case')) {
      const generatedTests = generateTestCases(userInput);
      
      let response = `🤖 **I've generated test cases based on your description:**\n\n`;
      
      generatedTests.forEach((test, index) => {
        response += `**${index + 1}. ${test.name}**\n`;
        response += `📝 ${test.description}\n\n`;
        response += `**Test Scenarios:**\n`;
        test.scenarios.forEach((scenario, i) => {
          response += `   ${i + 1}. ${scenario}\n`;
        });
        response += `\n`;
      });
      
      response += `💡 **Want me to create these test cases for you?** I can add them to your test suite with the proper category.`;
      
      return {
        response,
        generatedTests,
        actionType: 'test_generation'
      };
    }
    
    // Check for best practices requests
    if (input.includes('best practice') || input.includes('recommendation') || input.includes('should')) {
      return {
        response: `🎯 **Testing Best Practices:**

🔹 **Test Pyramid**: Focus on unit tests (fast), integration tests (medium), E2E tests (slow)
🔹 **Test Independence**: Each test should run independently
🔹 **Clear Naming**: Use descriptive test names that explain what's being tested
🔹 **Test Data**: Use realistic test data and clean up after tests
🔹 **Edge Cases**: Test boundary conditions and error scenarios
🔹 **Continuous Testing**: Integrate tests into your CI/CD pipeline

**For your specific case**, consider testing:
• Happy path scenarios (expected user behavior)
• Error conditions and edge cases
• Performance under load
• Security vulnerabilities
• Cross-browser/device compatibility`,
        actionType: 'advice'
      };
    }
    
    // Check for help requests
    if (input.includes('help') || input.includes('how') || input.includes('what')) {
      return {
        response: `🚀 **I can help you with:**

**Test Case Generation:**
• "Generate test cases for [feature]"
• "Create tests for [user scenario]"
• "What should I test for [functionality]"

**Testing Strategy:**
• "Best practices for [type] testing"
• "How to test [specific feature]"
• "Test scenarios for [workflow]"

**Examples to try:**
• "Generate test cases for user registration"
• "Create tests for payment processing"
• "What scenarios should I test for file upload?"
• "Best practices for API testing"

Just describe what you want to test and I'll help generate comprehensive test cases! 🎯`,
        actionType: 'help'
      };
    }
    
    // Default response
    return {
      response: `🤔 I understand you want to work on testing! Could you be more specific about what you'd like me to help with?

Try asking me to:
• **Generate test cases** for a specific feature
• **Suggest test scenarios** for your application
• **Provide best practices** for testing
• **Help optimize** existing tests

For example: "Generate test cases for a user profile page" or "What should I test for an API endpoint?"`,
      actionType: 'clarification'
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResult = getAiResponse(inputValue);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResult.response,
        timestamp: new Date(),
        actionType: aiResult.actionType,
        generatedTests: aiResult.generatedTests
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 second delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateTestCases = async (generatedTests) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create or get "AI Generated" category
      let aiCategory = categories.find(cat => cat.name === 'AI Generated');
      
      if (!aiCategory) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert([
            {
              name: 'AI Generated',
              user_id: user.id
            }
          ])
          .select()
          .single();

        if (categoryError) throw categoryError;
        aiCategory = newCategory;
      }

      // Create test cases
      const testCasesToCreate = generatedTests.map(test => ({
        name: test.name,
        description: `${test.description}\n\nTest Scenarios:\n${test.scenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        category_id: aiCategory.id,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('test_cases')
        .insert(testCasesToCreate);

      if (error) throw error;

      // Add success message
      const successMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ **Success!** I've created ${generatedTests.length} test cases in the "AI Generated" category. You can find them in your Test Cases section and customize them as needed!`,
        timestamp: new Date(),
        actionType: 'success'
      };

      setMessages(prev => [...prev, successMessage]);

      // Notify parent component
      if (onTestCaseGenerated) {
        onTestCaseGenerated();
      }

    } catch (error) {
      console.error('Error creating test cases:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: `❌ **Error**: I couldn't create the test cases. Please make sure you're logged in and try again.`,
        timestamp: new Date(),
        actionType: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary btn-circle btn-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <SparklesIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-base-100 rounded-lg shadow-2xl border border-base-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-primary rounded-t-lg text-primary-content">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5" />
          <h3 className="font-semibold">AI Testing Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-sm btn-circle text-primary-content hover:bg-primary-focus"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-content ml-4'
                  : 'bg-base-200 text-base-content mr-4'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
              
              {/* Action buttons for AI messages */}
              {message.type === 'ai' && message.generatedTests && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <button
                    onClick={() => handleCreateTestCases(message.generatedTests)}
                    className="btn btn-xs btn-accent gap-1"
                  >
                    <DocumentPlusIcon className="w-3 h-3" />
                    Create These Test Cases
                  </button>
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-200 rounded-lg p-3 mr-4">
              <div className="flex items-center space-x-2">
                <span className="loading loading-dots loading-sm"></span>
                <span className="text-sm text-base-content/70">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-base-300 bg-base-50">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setInputValue('Generate test cases for login form')}
            className="btn btn-xs btn-ghost text-xs"
            disabled={isLoading}
          >
            <LightBulbIcon className="w-3 h-3" />
            Login Tests
          </button>
          <button
            onClick={() => setInputValue('Best practices for API testing')}
            className="btn btn-xs btn-ghost text-xs"
            disabled={isLoading}
          >
            <ClipboardDocumentIcon className="w-3 h-3" />
            Best Practices
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate test cases..."
            className="textarea textarea-bordered textarea-sm flex-1 resize-none"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn btn-primary btn-sm"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
