import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { requirements, context } = await req.json();

    const systemPrompt = `You are an expert QA engineer. Generate test cases as a JSON object.

RESPOND WITH ONLY THIS JSON FORMAT:
{
  "testCases": [
    {
      "name": "Test Case Name",
      "description": "What this test validates",
      "scenarios": ["Step 1", "Step 2", "Step 3"],
      "category": "Functional",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Requirements:
- Generate 2-4 test cases in the testCases array
- Each test case needs: name, description, scenarios (array), category, tags
- Make scenarios specific and actionable
- No extra text, just the JSON object

IMPORTANT: Return ONLY the JSON object with testCases array.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate test cases for: ${requirements}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.8,
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    let aiResponse = openaiData.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Clean up the response to extract JSON
    console.log('Original AI response:', aiResponse);
    console.log('AI response length:', aiResponse.length);

    // Remove markdown code blocks and extra formatting
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse the JSON response directly
    let testCases;
    try {
      const parsed = JSON.parse(aiResponse);
      console.log('Successfully parsed JSON:', parsed);

      // Handle both array format and object format
      if (Array.isArray(parsed)) {
        testCases = parsed;
        console.log('Found direct array format');
      } else if (parsed.testCases && Array.isArray(parsed.testCases)) {
        testCases = parsed.testCases;
        console.log('Found object format with testCases array');
      } else {
        console.warn('Unexpected JSON structure:', parsed);
        throw new Error('Unexpected JSON structure');
      }

      console.log('Found', testCases.length, 'test cases');
      console.log('Test cases structure:', testCases.map(tc => ({
        name: tc.name?.substring(0, 50),
        hasDescription: !!tc.description,
        hasScenarios: Array.isArray(tc.scenarios),
        scenarioCount: Array.isArray(tc.scenarios) ? tc.scenarios.length : 0
      })));

      // Validate and clean each test case with more lenient validation
      testCases = testCases.filter((tc, index) => {
        const isValid = tc && typeof tc === 'object' && 
                        tc.name && typeof tc.name === 'string' && 
                        tc.name.trim().length > 0;
        if (!isValid) {
          console.warn(`Filtering out invalid test case at index ${index}:`, tc);
        }
        return isValid;
      }).map(tc => {
        // Ensure scenarios is an array
        let scenarios = [];
        if (Array.isArray(tc.scenarios)) {
          scenarios = tc.scenarios.filter(s => s && typeof s === 'string' && s.trim().length > 0);
        } else if (typeof tc.scenarios === 'string') {
          scenarios = [tc.scenarios];
        }

        // If no scenarios, create basic ones
        if (scenarios.length === 0) {
          scenarios = [
            'Execute the test case as described',
            'Verify expected results match requirements',
            'Document any issues or deviations found'
          ];
        }

        // Ensure description exists
        let description = '';
        if (tc.description && typeof tc.description === 'string') {
          description = tc.description.trim();
        }
        if (!description) {
          description = `Test case to validate ${tc.name.toLowerCase()}`;
        }

        return {
          name: String(tc.name).trim().substring(0, 200),
          description: description.substring(0, 500),
          scenarios: scenarios.map(s => String(s).trim().substring(0, 300)),
          category: tc.category && typeof tc.category === 'string' ? tc.category.trim() : 'AI Generated',
          tags: Array.isArray(tc.tags) ? tc.tags.filter(t => t && typeof t === 'string') : ['ai-generated']
        };
      });

      if (testCases.length === 0) {
        console.warn('No valid test cases found after filtering, using fallback');
        testCases = extractTestCasesFromText(aiResponse);
      }

      console.log('Final processed test cases:', testCases.length);

    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw response that failed to parse:', aiResponse);
      
      // Fallback: try to extract test cases from the response text
      testCases = extractTestCasesFromText(aiResponse);
      console.log('Used fallback parser, got', testCases.length, 'test cases');
    }

    // Log the interaction
    await supabaseClient.from('ai_interactions').insert([{
      user_id: user.id,
      message: requirements,
      response: JSON.stringify(testCases),
      context_type: 'test_generation',
      created_at: new Date().toISOString()
    }]);

    return new Response(JSON.stringify({
      testCases,
      count: testCases.length,
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    console.error('Error in ai-generate-tests function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      success: false,
      testCases: []
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

function extractTestCasesFromText(text) {
  // Fallback parser for when AI doesn't return valid JSON
  console.log('Using fallback text parser for:', text);
  const testCases = [];

  // Try to find patterns like "Test Case", "TC", numbered items, etc.
  const sections = text.split(/(?=Test Case|TC\s*\d+|\d+\.\s*[A-Z]|#{1,3}\s*[A-Z])/i);

  for (const section of sections) {
    const cleanSection = section.trim();
    if (cleanSection.length < 10) continue;

    const lines = cleanSection.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    // Extract name from first line
    let name = lines[0]
      .replace(/^(Test Case|TC)\s*\d*[:\-.]?\s*/i, '')
      .replace(/^#{1,3}\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .trim();

    if (!name || name.length < 3) continue;
    name = name.substring(0, 200);

    let description = '';
    const scenarios = [];
    let currentSection = 'description';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line looks like a step/scenario
      if (line.match(/^\d+\.|^-|^•|^Step|^Scenario|^Given|^When|^Then/i)) {
        currentSection = 'scenarios';
        const cleanStep = line
          .replace(/^\d+\.\s*|^-\s*|^•\s*|^Step\s*\d*[:\-.]?\s*/i, '')
          .replace(/^(Scenario|Given|When|Then)[:\-.]?\s*/i, '')
          .trim();
        if (cleanStep) {
          scenarios.push(cleanStep.substring(0, 300));
        }
      } else if (currentSection === 'description' && !description && line.length > 5) {
        description = line.substring(0, 500);
      } else if (currentSection === 'scenarios' && line.length > 3) {
        scenarios.push(line.substring(0, 300));
      }
    }

    // If no description found, create one from the name
    if (!description) {
      description = `Test case to verify ${name.toLowerCase()}`;
    }

    // If no scenarios found, create basic ones
    if (scenarios.length === 0) {
      scenarios.push('Execute the test scenario as described');
      scenarios.push('Verify expected results');
      scenarios.push('Document any findings');
    }

    testCases.push({
      name,
      description,
      scenarios,
      category: 'AI Generated',
      tags: ['ai-generated', 'fallback-parsed']
    });
  }

  // Ensure we have at least one test case
  if (testCases.length === 0) {
    const words = text.split(/\s+/).slice(0, 10).join(' ');
    testCases.push({
      name: 'Generated Test Case',
      description: `AI generated test case: ${words}...`,
      scenarios: [
        'Review the test requirements',
        'Execute the test steps',
        'Verify the expected results',
        'Document any issues found'
      ],
      category: 'AI Generated',
      tags: ['ai-generated', 'fallback']
    });
  }

  console.log('Fallback parser extracted:', testCases.length, 'test cases');
  return testCases;
}
