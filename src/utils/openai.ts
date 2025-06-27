import { OpenAIMessage, OpenAIConfig, TextChange } from '../types';

const DEFAULT_CONFIG: Partial<OpenAIConfig> = {
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
};

export class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async chatCompletion(messages: OpenAIMessage[]): Promise<string> {
    console.log('🔵 Making OpenAI API call...');
    console.log('API Key present:', !!this.config.apiKey);
    console.log('API Key format:', this.config.apiKey?.startsWith('sk-') ? 'Valid' : 'Invalid');
    console.log('Model:', this.config.model);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API Success');
    return data.choices[0]?.message?.content || '';
  }

  async getTextSuggestions(currentText: string, userPrompt: string): Promise<TextChange[]> {
    console.log('🟡 Getting text suggestions...');
    console.log('Text length:', currentText.length);
    console.log('User prompt:', userPrompt);
    
    const systemPrompt = `You are a professional writing assistant. Analyze the text and provide specific improvements based on the user's request.

IMPORTANT: Always respond with valid JSON array format, even if no changes are needed.

For grammar/spelling fixes, rewrite corrections, style improvements, respond with:
[
  {
    "original": "text to replace",
    "revised": "improved text",
    "startIndex": 0,
    "endIndex": 10
  }
]

Examples:
- Fix "hello world" → [{"original": "hello world", "revised": "Hello world.", "startIndex": 0, "endIndex": 11}]
- Fix "i am good" → [{"original": "i am", "revised": "I am", "startIndex": 0, "endIndex": 4}]
- No changes needed → []

Be generous with improvements - users want to see enhancements!`;

    const userMessage = `Please analyze this text and provide improvements based on the request: "${userPrompt}"

Text to improve:
"""
${currentText}
"""

Focus on:
- Grammar and spelling errors
- Punctuation improvements  
- Capitalization fixes
- Professional tone (if requested)
- Clarity and readability

Return ONLY valid JSON array with suggested changes.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let aiResponse: string;
    
    try {
      aiResponse = await this.chatCompletion(messages);
      console.log('Raw AI response:', aiResponse);
    } catch (error) {
      console.error('❌ Failed to get AI response:', error);
      return [];
    }

    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to parse the JSON response
      const suggestions = JSON.parse(cleanResponse);
      console.log('Parsed suggestions:', suggestions);
      
      // Validate the response format
      if (!Array.isArray(suggestions)) {
        console.error('❌ Response is not an array');
        throw new Error('Invalid response format');
      }

      // More lenient validation and auto-fix indices
      const validSuggestions = suggestions
        .filter((suggestion: any) => 
          suggestion.original && 
          suggestion.revised && 
          suggestion.original !== suggestion.revised
        )
        .map((suggestion: any, index: number) => {
          // Auto-calculate indices if missing or invalid
          const startIndex = typeof suggestion.startIndex === 'number' 
            ? suggestion.startIndex 
            : currentText.indexOf(suggestion.original);
          
          const endIndex = typeof suggestion.endIndex === 'number' 
            ? suggestion.endIndex 
            : startIndex + suggestion.original.length;
          
          return {
            original: suggestion.original,
            revised: suggestion.revised,
            startIndex: Math.max(0, startIndex),
            endIndex: Math.max(startIndex + suggestion.original.length, endIndex)
          };
        });
      
      console.log('Valid suggestions:', validSuggestions.length, 'out of', suggestions.length);
      return validSuggestions;
    } catch (error) {
      console.error('❌ Failed to parse OpenAI response:', error);
      
      // Fallback: try to extract suggestions from natural language response
      try {
        return this.parseNaturalLanguageResponse(aiResponse, currentText);
      } catch (fallbackError) {
        console.error('❌ Fallback parsing also failed:', fallbackError);
        return [];
      }
    }
  }

  // Fallback method to parse natural language responses
  private parseNaturalLanguageResponse(response: string, currentText: string): TextChange[] {
    console.log('🔄 Attempting natural language parsing...');
    
    // Simple pattern matching for common grammar fixes
    const suggestions: TextChange[] = [];
    
    // Look for common patterns like "change X to Y"
    const patterns = [
      /change "([^"]+)" to "([^"]+)"/gi,
      /replace "([^"]+)" with "([^"]+)"/gi,
      /"([^"]+)" should be "([^"]+)"/gi,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const original = match[1];
        const revised = match[2];
        const startIndex = currentText.indexOf(original);
        
        if (startIndex !== -1) {
          suggestions.push({
            original,
            revised,
            startIndex,
            endIndex: startIndex + original.length
          });
        }
      }
    });
    
    console.log('Natural language suggestions found:', suggestions.length);
    return suggestions;
  }
} 