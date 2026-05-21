import React, { useState, useEffect } from 'react'

interface AnalysisResult {
  verdict: 'WAHR' | 'TEILWEISE' | 'FALSCH' | 'UNKNOWN'
  reasoning: string
  provider: string
}

export const PopupApp: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadSelectedText()
  }, [])

  const loadSelectedText = async () => {
    try {
      const data = await chrome.storage.local.get('selectedText')
      if (data.selectedText?.trim()) {
        setSelectedText(data.selectedText)
      } else {
        setError('Markiere einen Text auf einer Website, um ihn zu überprüfen.')
      }
    } catch (err) {
      setError('Der Text konnte nicht geladen werden.')
    }
  }

  const handleAnalyze = async () => {
    if (!selectedText.trim()) {
      setError('Kein Text zu analysieren')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const config = await chrome.storage.local.get('extensionConfig')
      if (!config.extensionConfig) {
        setError('Bitte konfiguriere einen Provider in den Einstellungen.')
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      const { selectedProvider, apiKeys } = config.extensionConfig
      const providerConfig = apiKeys?.[selectedProvider]
      
      if (!selectedProvider) {
        setError('Bitte wähle einen Provider in den Einstellungen.')
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      // Pollinations doesn't require a key
      if (selectedProvider !== 'pollinations' && !providerConfig?.key) {
        setError(`Bitte konfiguriere einen API-Key für ${selectedProvider}.`)
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      chrome.runtime.sendMessage(
        { action: 'analyzeText', text: selectedText },
        (response) => {
          setIsLoading(false)
          if (chrome.runtime.lastError) {
            setError('Fehler: ' + chrome.runtime.lastError.message)
            return
          }
          if (response?.success) {
            setResult(response.result)
          } else {
            setError(`Fehler: ${response?.error || 'Unbekannter Fehler'}`)
          }
        }
      )
    } catch (err) {
      setIsLoading(false)
      setError(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  const handleClear = () => {
    chrome.storage.local.remove('selectedText')
    setSelectedText('')
    setResult(null)
    setError('')
  }

  const verdictConfig = {
    WAHR: { color: '#4CAF50', text: 'Wahr', bgColor: 'rgba(76, 175, 80, 0.1)' },
    TEILWEISE: { color: '#FF9800', text: 'Teilweise wahr', bgColor: 'rgba(255, 152, 0, 0.1)' },
    FALSCH: { color: '#F44336', text: 'Falsch oder Irreführend', bgColor: 'rgba(244, 67, 54, 0.1)' },
    UNKNOWN: { color: '#999', text: 'Unklar', bgColor: 'rgba(153, 153, 153, 0.1)' }
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 5px 0', color: '#1976d2' }}>Ist das wahr?</h1>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Überprüfe Aussagen mit KI</p>
      </div>

      {/* Selected Text Display */}
      {selectedText && (
        <div style={{
          background: '#e3f2fd',
          padding: '15px',
          borderLeft: '4px solid #1976d2',
          borderRadius: '6px',
          marginBottom: '15px',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }}>Markierter Text:</p>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>
            {selectedText}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && !result && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '13px',
          borderLeft: '4px solid #c62828'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: '30px 20px',
          background: '#f5f5f5',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 15px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>Text wird analysiert...</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in',
          marginBottom: '15px'
        }}>
          {/* Verdict */}
          <div style={{
            padding: '15px',
            background: verdictConfig[result.verdict].bgColor,
            borderLeft: `4px solid ${verdictConfig[result.verdict].color}`,
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: verdictConfig[result.verdict].color,
              marginBottom: '5px'
            }}>
              {verdictConfig[result.verdict].text}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '8px',
              fontWeight: '500'
            }}>
              Analysiert mit: {result.provider}
            </div>
          </div>

          {/* Reasoning */}
          <div style={{
            background: '#f9f9f9',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#333'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1976d2' }}>Begründung:</p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.reasoning}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !selectedText || !!result}
          style={{
            flex: 1,
            padding: '12px',
            background: isLoading || !selectedText || !!result ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isLoading || !selectedText || !!result ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Analysieren
        </button>
        {result && (
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: '12px',
              background: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Neuer Text
          </button>
        )}
      </div>

      {/* Settings Link */}
      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '10px'
      }}>
        <a
          href="#"
          onClick={() => chrome.runtime.openOptionsPage()}
          style={{
            color: '#1976d2',
            textDecoration: 'none',
            fontSize: '12px'
          }}
        >
          Einstellungen
        </a>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
