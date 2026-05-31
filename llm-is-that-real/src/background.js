// Background Service Worker for Ist das wahr?

console.log('[Background] Service worker loaded');

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Extension installed, creating context menu');
  
  // Initialize default config
  chrome.storage.local.get('extensionConfig', (result) => {
    if (!result.extensionConfig) {
      const defaultConfig = {
        selectedProvider: 'pollinations',
        apiKeys: {
          openai: { key: '', model: 'gpt-5.4-mini' },
          anthropic: { key: '', model: 'claude-opus-4-6' },
          gemini: { key: '', model: 'gemini-3.5-flash' },
          pollinations: { key: '', model: 'default' }
        }
      };
      chrome.storage.local.set({ extensionConfig: defaultConfig });
    }
  });
  
  chrome.contextMenus.create({
    id: 'fact-check',
    title: 'Mit AI überprüfen',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info) => {
  console.log('[Background] Context menu clicked with text:', info.selectionText?.substring(0, 50));
  if (info.menuItemId === 'fact-check' && info.selectionText) {
    chrome.storage.local.set({ selectedText: info.selectionText });
    chrome.action.openPopup();
  }
});

// Handle messaging from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', request.action);
  
  if (request.action === 'analyzeText') {
    console.log('[Background] Analyzing text:', request.text?.substring(0, 50));
    analyzeText(request.text).then(result => {
      console.log('[Background] Analysis complete:', result);
      sendResponse({ success: true, result });
    }).catch(error => {
      console.error('[Background] Analysis error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Async response
  }
});

async function analyzeText(text) {
  try {
    const config = await chrome.storage.local.get('extensionConfig');
    console.log('[API] Config:', { selectedProvider: config.extensionConfig?.selectedProvider });
    
    if (!config.extensionConfig) {
      throw new Error('Keine API-Konfiguration gefunden');
    }

    const { selectedProvider, apiKeys } = config.extensionConfig;
    const providerConfig = apiKeys?.[selectedProvider];

    if (!selectedProvider) {
      throw new Error('Kein Provider ausgewählt');
    }

    const systemPrompt = "Du bist ein unparteiischer Fact-Checking-Assistent. Analysiere den folgenden Text auf seine Richtigkeit, logische Konsistenz, potenzielle Fehlinformationen oder Fake News. Gib eine kurze Einschätzung (z.B. Wahr, Teilweise Wahr, Falsch/Irreführend) und eine prägnante Begründung ab.";

    console.log(`[API] Using provider: ${selectedProvider}`);

    switch (selectedProvider) {
      case 'openai':
        return await callOpenAI(text, providerConfig?.key, providerConfig?.model, systemPrompt);
      case 'anthropic':
        return await callAnthropic(text, providerConfig?.key, systemPrompt);
      case 'gemini':
        return await callGemini(text, providerConfig?.key, systemPrompt);
      case 'pollinations':
        return await callPollinations(text, providerConfig?.key, systemPrompt);
      default:
        throw new Error('Unbekannter Provider: ' + selectedProvider);
    }
  } catch (error) {
    console.error('[analyzeText] Error:', error);
    throw error;
  }
}

async function callOpenAI(text, apiKey, model, systemPrompt) {
  console.log('[OpenAI] Calling API with model:', model);
  
  if (!apiKey) {
    throw new Error('OpenAI API-Key fehlt');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-5.4-mini',
        input: systemPrompt + ' ' + text
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('[OpenAI] Failed to parse JSON:', e);
      throw new Error(`OpenAI returned invalid JSON: ${response.status}`);
    }
    
    if (!response.ok) {
      console.error('[OpenAI] Error response:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || response.status}`);
    }

    const reasoning = data.choices?.[0]?.message?.content;
    if (!reasoning) {
      throw new Error('OpenAI returned empty response');
    }
    
    console.log('[OpenAI] Response:', reasoning.substring(0, 100));
    
    return {
      verdict: extractVerdict(reasoning),
      reasoning,
      provider: 'OpenAI (' + (model || 'gpt-5.4-mini') + ')'
    };
  } catch (error) {
    console.error('[OpenAI] Fatal error:', error);
    throw error;
  }
}

async function callAnthropic(text, apiKey, systemPrompt) {
  console.log('[Anthropic] Calling API');
  
  if (!apiKey) {
    throw new Error('Anthropic API-Key fehlt');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }]
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('[Anthropic] Failed to parse JSON:', e);
      throw new Error(`Anthropic returned invalid JSON: ${response.status}`);
    }
    
    if (!response.ok) {
      console.error('[Anthropic] Error response:', data);
      throw new Error(`Anthropic API error: ${data.error?.message || response.status}`);
    }

    const reasoning = data.content?.[0]?.text;
    if (!reasoning) {
      throw new Error('Anthropic returned empty response');
    }
    
    console.log('[Anthropic] Response:', reasoning.substring(0, 100));
    
    return {
      verdict: extractVerdict(reasoning),
      reasoning,
      provider: 'Anthropic (Claude 3 Sonnet)'
    };
  } catch (error) {
    console.error('[Anthropic] Fatal error:', error);
    throw error;
  }
}

async function callGemini(text, apiKey, systemPrompt) {
  console.log('[Gemini] Calling API');
  
  if (!apiKey) {
    throw new Error('Gemini API-Key fehlt');
  }

  try {
    const model = 'gemini-3.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 
        'x-goog-api-key': `${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { text: text }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 10000
        }
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('[Gemini] Failed to parse JSON:', e);
      throw new Error(`Gemini returned invalid JSON: ${response.status}`);
    }
    
    if (!response.ok) {
      console.error('[Gemini] Error response:', data);
      throw new Error(`Gemini API error: ${data.error?.message || response.status}`);
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('[Gemini] Unexpected response format:', data);
      throw new Error('Gemini API returned unexpected format');
    }

    const reasoning = data.candidates[0].content.parts[0].text;
    console.log('[Gemini] Response:', reasoning.substring(0, 100));
    
    return {
      verdict: extractVerdict(reasoning),
      reasoning,
      provider: 'Google Gemini (3.5 Flash)'
    };
  } catch (error) {
    console.error('[Gemini] Fatal error:', error);
    throw error;
  }
}

async function callPollinations(text, systemPrompt) {
  console.log('[Pollinations] Calling API');
  
  try {
    // Pollinations.ai is free and doesn't require an API key
    const response = await fetch('https://text.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 1000
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('[Pollinations] Failed to parse JSON:', e);
      throw new Error(`Pollinations returned invalid JSON: ${response.status}`);
    }
    
    if (!response.ok) {
      console.error('[Pollinations] Error response:', data);
      throw new Error(`Pollinations API error: ${data.error?.message || response.status}`);
    }

    const reasoning = data.choices?.[0]?.message?.content;
    if (!reasoning) {
      throw new Error('Pollinations returned empty response');
    }
    
    console.log('[Pollinations] Response:', reasoning.substring(0, 100));
    
    return {
      verdict: extractVerdict(reasoning),
      reasoning,
      provider: 'Pollinations.ai (Kostenlos)'
    };
  } catch (error) {
    console.error('[Pollinations] Fatal error:', error);
    throw error;
  }
}

function extractVerdict(text) {
  const lower = text.toLowerCase();
  
  // Check for verdicts in German
  if (lower.includes('falsch') || lower.includes('irreführend') || lower.includes('ist falsch') || lower.includes('nicht wahr')) {
    return 'FALSCH';
  }
  if (lower.includes('teilweise') || lower.includes('teilweise wahr') || lower.includes('teils')) {
    return 'TEILWEISE';
  }
  if (lower.includes('wahr') || lower.includes('ist wahr') || lower.includes('ist korrekt')) {
    return 'WAHR';
  }
  
  return 'UNKNOWN';
}
