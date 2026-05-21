import React, { useState, useEffect } from 'react'

interface ProviderConfig {
  key: string
  model: string
}

interface ApiKeysConfig {
  [provider: string]: ProviderConfig
}

export const OptionsApp: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState('pollinations')
  const [apiKeys, setApiKeys] = useState<ApiKeysConfig>({
    openai: { key: '', model: 'gpt-3.5-turbo' },
    anthropic: { key: '', model: 'claude-3-sonnet-20240229' },
    gemini: { key: '', model: 'gemini-2.0-flash' },
    pollinations: { key: '', model: 'default' }
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const providers = [
    { id: 'pollinations', name: 'Pollinations.ai (Kostenlos)' },
    { id: 'openai', name: 'OpenAI (GPT)' },
    { id: 'anthropic', name: 'Anthropic (Claude)' },
    { id: 'gemini', name: 'Google Gemini' }
  ]

  const models: Record<string, string[]> = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-3-flash'],
    pollinations: ['default']
  }

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const data = await chrome.storage.local.get('extensionConfig')
      if (data.extensionConfig) {
        const config = data.extensionConfig
        setSelectedProvider(config.selectedProvider || 'pollinations')
        setApiKeys(config.apiKeys || {
          openai: { key: '', model: 'gpt-3.5-turbo' },
          anthropic: { key: '', model: 'claude-3-sonnet-20240229' },
          gemini: { key: '', model: 'gemini-3.1-flash-lite' },
          pollinations: { key: '', model: 'default' }
        })
      }
    } catch (err) {
      console.error('Error loading options:', err)
    }
  }

  const handleKeyChange = (provider: string, newKey: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: { ...prev[provider], key: newKey }
    }))
  }

  const handleModelChange = (provider: string, newModel: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: { ...prev[provider], model: newModel }
    }))
  }

  const handleSave = async () => {
    // Pollinations doesn't require a key, others do
    const activeProvider = selectedProvider
    if (activeProvider !== 'pollinations' && !apiKeys[activeProvider]?.key?.trim()) {
      setErrorMessage(`Bitte gebe einen API-Key für ${activeProvider} ein`)
      setSuccessMessage('')
      return
    }

    try {
      const config = { selectedProvider, apiKeys }
      await chrome.storage.local.set({ extensionConfig: config })
      setSuccessMessage('Einstellungen gespeichert')
      setErrorMessage('')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      setErrorMessage(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
      setSuccessMessage('')
    }
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '700px',
      margin: '0 auto',
      padding: '30px 20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Erweiterungseinstellungen</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Konfiguriere API-Keys für jeden Provider</p>

      {/* Messages */}
      {successMessage && (
        <div style={{
          background: '#e8f5e9',
          color: '#2e7d32',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          borderLeft: '4px solid #2e7d32'
        }}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          borderLeft: '4px solid #c62828'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Provider Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {providers.map(provider => (
          <button
            key={provider.id}
            onClick={() => setSelectedProvider(provider.id)}
            style={{
              padding: '15px',
              border: selectedProvider === provider.id ? '2px solid #1976d2' : '2px solid #ddd',
              background: selectedProvider === provider.id ? '#e3f2fd' : 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: selectedProvider === provider.id ? '600' : '500',
              color: selectedProvider === provider.id ? '#1976d2' : '#333',
              transition: 'all 0.2s',
              fontSize: '13px'
            }}
          >
            {provider.name}
          </button>
        ))}
      </div>

      {/* Provider Config */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '5px' }}>
          {providers.find(p => p.id === selectedProvider)?.name}
        </h2>

        {selectedProvider === 'pollinations' && (
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
            Pollinations.ai ist kostenlos und benötigt keinen API-Key.
          </p>
        )}

        {/* API Key Input */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
            API-Key:
          </label>
          <input
            type="password"
            value={apiKeys[selectedProvider]?.key || ''}
            onChange={(e) => handleKeyChange(selectedProvider, e.target.value)}
            placeholder={selectedProvider === 'pollinations' ? '(Optional)' : 'API-Key eingeben...'}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <small style={{ display: 'block', marginTop: '8px', color: '#999', fontSize: '12px' }}>
            {selectedProvider === 'pollinations' && 'Kostenlos - kein Key nötig'}
            {selectedProvider === 'openai' && 'Den Key erhalten Sie unter platform.openai.com'}
            {selectedProvider === 'anthropic' && 'Den Key erhalten Sie unter console.anthropic.com'}
            {selectedProvider === 'gemini' && 'Den Key erhalten Sie unter ai.google.dev'}
          </small>
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
            Modell:
          </label>
          <select
            value={apiKeys[selectedProvider]?.model || ''}
            onChange={(e) => handleModelChange(selectedProvider, e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            {models[selectedProvider]?.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Info */}
        <div style={{
          background: '#f0f7ff',
          padding: '12px',
          borderRadius: '6px',
          borderLeft: '3px solid #1976d2',
          fontSize: '12px',
          color: '#333'
        }}>
          {selectedProvider === 'pollinations' && (
            <p>Pollinations.ai bietet kostenlose AI-Modelle ohne API-Key. Die Ergebnisse können jedoch variieren.</p>
          )}
          {selectedProvider === 'openai' && (
            <p>OpenAI bietet zwar zahlpflichtige, aber sehr zuverlässige Modelle.</p>
          )}
          {selectedProvider === 'anthropic' && (
            <p>Anthropic Claude ist bekannt für hohe Qualität und Sicherheit.</p>
          )}
          {selectedProvider === 'gemini' && (
            <p>Google Gemini ist schnell und bietet kostenlose API Token zur Verwendung an.</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
      >
        Einstellungen speichern
      </button>

      {/* All Providers Info */}
      <div style={{
        background: '#fff3e0',
        padding: '15px',
        borderRadius: '6px',
        borderLeft: '4px solid #FF9800',
        fontSize: '12px',
        color: '#333'
      }}>
        <h3 style={{ marginBottom: '10px', fontSize: '13px' }}>Alle Provider:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>Pollinations.ai:</strong> Kostenlos, kein Key</li>
          <li><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>platform.openai.com</a></li>
          <li><strong>Anthropic:</strong> <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>console.anthropic.com</a></li>
          <li><strong>Google Gemini:</strong> <a href="https://ai.google.dev" target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>ai.google.dev</a></li>
        </ul>
      </div>
    </div>
  )
}
