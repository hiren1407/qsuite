import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  context?: {
    type: 'test_generation' | 'test_optimization' | 'general_chat';
    testCases?: any[];
    categories?: any[];
  };
}

interface TestCase {
  name: string;
  description: string;
  scenarios: string[];
  category?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { message, context }: ChatRequest = await req.json();

    // Generate system prompt based on context
    let systemPrompt = `You are a helpful AI assistant for QSuite, a comprehensive test case management platform. Your role is to help users understand and effectively use QSuite's features.

**QSuite Features:**
🗂️ **File Management**: Upload and organize test files, scripts, documentation, and artifacts
📝 **Test Case Management**: Create, edit, and organize test cases with categories and detailed descriptions
🏷️ **Category Organization**: Group test cases into logical categories for better organization
▶️ **Test Execution (RunView)**: Execute tests and track results with status updates
📋 **Queue Management**: Schedule and organize test execution workflows
🤖 **AI Test Generator**: Generate test cases automatically using AI from descriptions
💬 **AI Chat**: Get help and guidance on using QSuite (that's me!)
🔐 **User Authentication**: Secure user accounts with personalized, isolated test suites

**User Interface Navigation:**
- **Test Cases Tab**: Main hub for creating and managing test cases
- **Queue Tab**: Organize test execution priorities and workflows  
- **Files Tab**: Upload and manage test artifacts, screenshots, documents
- **Run View**: Execute tests and track results with status updates
- **AI Features**: AI Test Generator for automated test creation, AI Chat for help

**Best Practices:**
- Organize test cases using meaningful categories
- Write clear, actionable test descriptions
- Use proper status tracking (Not Started, In Progress, Passed, Failed, Blocked)
- Upload relevant files and artifacts for documentation
- Use AI Test Generator for initial test case creation, then refine manually
- Leverage the Queue feature to organize test execution workflows

**You can help users with:**
- Understanding QSuite features and how to use them
- Navigation guidance and best practices
- Troubleshooting common issues
- Feature explanations and usage tips
- Test management strategies within QSuite
- Getting started with different QSuite features

Be friendly, concise, and practical. Focus on helping users be more effective with QSuite. For test case generation, direct users to the AI Test Generator tool rather than generating test cases in chat.`;

    if (context?.type === 'test_generation') {
      systemPrompt += `\n\nNote: The user is asking about test generation, but focus on explaining how they can use QSuite's test case creation features rather than generating actual test cases. Guide them to use QSuite's built-in test case forms and AI test generator tool.`;
    }

    // Prepare the OpenAI API request
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the more cost-effective model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse the AI response for QSuite product assistance
    let parsedResponse = {
      content: aiResponse,
      actionType: 'product_help',
      message: aiResponse
    };

    // If user is asking about test generation, guide them to use QSuite's features
    if (context?.type === 'test_generation') {
      parsedResponse.actionType = 'feature_guidance';
      parsedResponse.content = aiResponse + '\n\n💡 **Want to create test cases?** Use QSuite\'s dedicated AI Test Generator in the sidebar, or create them manually using the "Create Test Case" button!';
    }

    // Log the interaction for analytics (optional)
    await supabaseClient
      .from('ai_interactions')
      .insert([
        {
          user_id: user.id,
          message: message,
          response: aiResponse,
          context_type: context?.type || 'product_help',
          created_at: new Date().toISOString()
        }
      ]);

    return new Response(
      JSON.stringify(parsedResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        actionType: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

// Note: Test case parsing functionality removed as AI chat now focuses on product help
// For test case generation, users should use the dedicated AI Test Generator feature
