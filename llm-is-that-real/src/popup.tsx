import React, { useState, useEffect } from 'react'

interface AnalysisResult {
  verdict: 'WAHR' | 'TEILWEISE' | 'FALSCH' | 'UNKNOWN'
  reasoning: string
  provider: string
}

export const PopupApp: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [manualText, setManualText] = useState<string>('')
  const [useManualText, setUseManualText] = useState(false)
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
      }
    } catch (err) {
      console.error('Error loading selected text:', err)
    }
  }

  const textToAnalyze = useManualText ? manualText : selectedText

  const handleAnalyze = async () => {
    if (!textToAnalyze.trim()) {
      setError('❌ Kein Text zu analysieren')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const config = await chrome.storage.local.get('extensionConfig')
      if (!config.extensionConfig) {
        setError('⚙️ Bitte konfigurieren Sie einen Provider in den Einstellungen')
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      const { selectedProvider, apiKeys } = config.extensionConfig
      const providerConfig = apiKeys?.[selectedProvider]
      
      if (!selectedProvider) {
        setError('⚙️ Bitte wählen Sie einen Provider in den Einstellungen')
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      // Pollinations doesn't require a key
      if (selectedProvider !== 'pollinations' && !providerConfig?.key) {
        setError(`⚙️ Bitte konfigurieren Sie einen API-Key für ${selectedProvider}`)
        chrome.runtime.openOptionsPage()
        setIsLoading(false)
        return
      }

      chrome.runtime.sendMessage(
        { action: 'analyzeText', text: textToAnalyze },
        (response) => {
          setIsLoading(false)
          if (chrome.runtime.lastError) {
            setError('❌ Fehler: ' + chrome.runtime.lastError.message)
            return
          }
          if (response?.success) {
            setResult(response.result)
          } else {
            setError(`❌ Fehler: ${response?.error || 'Unbekannter Fehler'}`)
          }
        }
      )
    } catch (err) {
      setIsLoading(false)
      setError(`❌ Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  const handleClear = () => {
    setManualText('')
    setSelectedText('')
    chrome.storage.local.remove('selectedText')
    setResult(null)
    setError('')
    setUseManualText(false)
  }

  const verdictConfig = {
    WAHR: { color: '#4CAF50', text: '✅ Wahr', bgColor: 'rgba(76, 175, 80, 0.1)' },
    TEILWEISE: { color: '#FF9800', text: '⚠️ Teilweise wahr', bgColor: 'rgba(255, 152, 0, 0.1)' },
    FALSCH: { color: '#F44336', text: '❌ Falsch/Irreführend', bgColor: 'rgba(244, 67, 54, 0.1)' },
    UNKNOWN: { color: '#999', text: '❓ Unbekannt', bgColor: 'rgba(153, 153, 153, 0.1)' }
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 5px 0', color: '#1976d2' }}>🔍 Ist das wahr?</h1>
        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>AI-powered fact-checking</p>
      </div>

      {/* Text Input Tabs */}
      {!result && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #ddd' }}>
          {selectedText && (
            <button
              onClick={() => setUseManualText(false)}
              style={{
                padding: '8px 12px',
                background: !useManualText ? '#1976d2' : 'transparent',
                color: !useManualText ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: !useManualText ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              📋 Markierter Text
            </button>
          )}
          <button
            onClick={() => setUseManualText(true)}
            style={{
              padding: '8px 12px',
              background: useManualText ? '#1976d2' : 'transparent',
              color: useManualText ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: useManualText ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            ✏️ Text eingeben
          </button>
        </div>
      )}

      {/* Marked Text Display */}
      {!useManualText && selectedText && !result && (
        <div style={{
          background: '#e3f2fd',
          padding: '15px',
          borderLeft: '4px solid #1976d2',
          borderRadius: '6px',
          marginBottom: '15px',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }}>📋 Markierter Text:</p>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>
            {selectedText}
          </p>
        </div>
      )}

      {/* Manual Text Input */}
      {useManualText && !result && (
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }}>✏️ Text eingeben (Copy & Paste):</p>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Text hier einfügen und Analysieren drücken..."
            style={{
              width: '100%',
              height: '120px',
              padding: '12px',
              border: '2px solid #1976d2',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />
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
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>⏳ Analysiere Text...</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in',
          marginBottom: '15px'
        }}>
          {/* Original Text */}
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px',
            maxHeight: '80px',
            overflowY: 'auto'
          }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 6px 0' }}>📋 Analysierter Text:</p>
            <p style={{ fontSize: '12px', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>
              {textToAnalyze.substring(0, 200)}{textToAnalyze.length > 200 ? '...' : ''}
            </p>
          </div>

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
            color: '#333',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1976d2' }}>💭 Begründung:</p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.reasoning}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !textToAnalyze || !!result}
          style={{
            flex: 1,
            padding: '12px',
            background: isLoading || !textToAnalyze || !!result ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isLoading || !textToAnalyze || !!result ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          🚀 Analysieren
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
            🔄 Neuer Text
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
          ⚙️ Einstellungen
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
