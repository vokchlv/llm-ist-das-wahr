import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const parseMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    // Match **text** for bold, *text* for italic, __text__ for underline
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(_jsx("span", { children: text.substring(lastIndex, match.index) }, `text-${lastIndex}`));
        }
        // Add the formatted text
        if (match[1]) {
            // **bold**
            parts.push(_jsx("strong", { style: { fontWeight: 'bold' }, children: match[1] }, `bold-${match.index}`));
        }
        else if (match[2]) {
            // *italic*
            parts.push(_jsx("em", { style: { fontStyle: 'italic' }, children: match[2] }, `italic-${match.index}`));
        }
        else if (match[3]) {
            // __underline__
            parts.push(_jsx("u", { children: match[3] }, `underline-${match.index}`));
        }
        lastIndex = regex.lastIndex;
    }
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(_jsx("span", { children: text.substring(lastIndex) }, `text-${lastIndex}`));
    }
    return parts.length === 0 ? text : parts;
};
export const PopupApp = () => {
    const [selectedText, setSelectedText] = useState('');
    const [manualText, setManualText] = useState('');
    const [useManualText, setUseManualText] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        loadSelectedText();
    }, []);
    const loadSelectedText = async () => {
        try {
            const data = await chrome.storage.local.get('selectedText');
            if (data.selectedText?.trim()) {
                setSelectedText(data.selectedText);
            }
        }
        catch (err) {
            console.error('Error loading selected text:', err);
        }
    };
    const textToAnalyze = useManualText ? manualText : selectedText;
    const handleAnalyze = async () => {
        if (!textToAnalyze.trim()) {
            setError('❌ Kein Text zu analysieren');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const config = await chrome.storage.local.get('extensionConfig');
            if (!config.extensionConfig) {
                setError('⚙️ Bitte konfigurieren Sie einen Provider in den Einstellungen');
                chrome.runtime.openOptionsPage();
                setIsLoading(false);
                return;
            }
            const { selectedProvider, apiKeys } = config.extensionConfig;
            const providerConfig = apiKeys?.[selectedProvider];
            if (!selectedProvider) {
                setError('⚙️ Bitte wählen Sie einen Provider in den Einstellungen');
                chrome.runtime.openOptionsPage();
                setIsLoading(false);
                return;
            }
            // Pollinations doesn't require a key
            if (selectedProvider !== 'pollinations' && !providerConfig?.key) {
                setError(`⚙️ Bitte konfigurieren Sie einen API-Key für ${selectedProvider}`);
                chrome.runtime.openOptionsPage();
                setIsLoading(false);
                return;
            }
            chrome.runtime.sendMessage({ action: 'analyzeText', text: textToAnalyze }, (response) => {
                setIsLoading(false);
                if (chrome.runtime.lastError) {
                    setError('❌ Fehler: ' + chrome.runtime.lastError.message);
                    return;
                }
                if (response?.success) {
                    setResult(response.result);
                }
                else {
                    setError(`❌ Fehler: ${response?.error || 'Unbekannter Fehler'}`);
                }
            });
        }
        catch (err) {
            setIsLoading(false);
            setError(`❌ Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
        }
    };
    const handleClear = () => {
        setManualText('');
        setSelectedText('');
        chrome.storage.local.remove('selectedText');
        setResult(null);
        setError('');
        setUseManualText(false);
    };
    const verdictConfig = {
        WAHR: { color: '#4CAF50', text: '✅ Wahr', bgColor: 'rgba(76, 175, 80, 0.1)' },
        TEILWEISE: { color: '#FF9800', text: '⚠️ Teilweise wahr', bgColor: 'rgba(255, 152, 0, 0.1)' },
        FALSCH: { color: '#F44336', text: '❌ Falsch/Irreführend', bgColor: 'rgba(244, 67, 54, 0.1)' },
        UNKNOWN: { color: '#999', text: '❓ Unbekannt', bgColor: 'rgba(153, 153, 153, 0.1)' }
    };
    return (_jsxs("div", { style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }, children: [_jsxs("div", { style: { marginBottom: '20px', textAlign: 'center' }, children: [_jsx("h1", { style: { fontSize: '24px', margin: '0 0 5px 0', color: '#1976d2' }, children: "\uD83D\uDD0D Ist das wahr?" }), _jsx("p", { style: { fontSize: '12px', color: '#666', margin: 0 }, children: "AI-gest\u00FCtzte Faktenpr\u00FCfung" }), _jsx("p", { style: { fontSize: '12px', color: '#666', margin: 0 }, children: "AI kann Fehler machen, daher im Zweifel vorsichtig sein!" })] }), !result && (_jsxs("div", { style: { display: 'flex', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #ddd' }, children: [selectedText && (_jsx("button", { onClick: () => setUseManualText(false), style: {
                            padding: '8px 12px',
                            background: !useManualText ? '#1976d2' : 'transparent',
                            color: !useManualText ? 'white' : '#666',
                            border: 'none',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: !useManualText ? '600' : '500',
                            transition: 'all 0.2s'
                        }, children: "\uD83D\uDCCB Markierter Text" })), _jsx("button", { onClick: () => setUseManualText(true), style: {
                            padding: '8px 12px',
                            background: useManualText ? '#1976d2' : 'transparent',
                            color: useManualText ? 'white' : '#666',
                            border: 'none',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: useManualText ? '600' : '500',
                            transition: 'all 0.2s'
                        }, children: "\u270F\uFE0F Text eingeben" })] })), !useManualText && selectedText && !result && (_jsxs("div", { style: {
                    background: '#e3f2fd',
                    padding: '15px',
                    borderLeft: '4px solid #1976d2',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                }, children: [_jsx("p", { style: { fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }, children: "\uD83D\uDCCB Markierter Text:" }), _jsx("p", { style: { fontSize: '13px', lineHeight: '1.5', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }, children: selectedText })] })), useManualText && !result && (_jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("p", { style: { fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 8px 0' }, children: "\u270F\uFE0F Text eingeben (Copy & Paste):" }), _jsx("textarea", { value: manualText, onChange: (e) => setManualText(e.target.value), placeholder: "Text hier einf\u00FCgen und Analysieren dr\u00FCcken...", style: {
                            width: '100%',
                            height: '120px',
                            padding: '12px',
                            border: '2px solid #1976d2',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'none',
                            boxSizing: 'border-box'
                        } })] })), error && !result && (_jsx("div", { style: {
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    fontSize: '13px',
                    borderLeft: '4px solid #c62828'
                }, children: error })), isLoading && (_jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '30px 20px',
                    background: '#f5f5f5',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }, children: [_jsx("div", { style: {
                            width: '40px',
                            height: '40px',
                            margin: '0 auto 15px',
                            border: '4px solid #e0e0e0',
                            borderTop: '4px solid #1976d2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        } }), _jsx("p", { style: { margin: 0, color: '#666', fontSize: '13px' }, children: "\u23F3 Analysiere Text..." })] })), result && (_jsxs("div", { style: {
                    animation: 'fadeIn 0.3s ease-in',
                    marginBottom: '15px'
                }, children: [_jsxs("div", { style: {
                            background: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            maxHeight: '80px',
                            overflowY: 'auto'
                        }, children: [_jsx("p", { style: { fontSize: '11px', fontWeight: '600', color: '#666', margin: '0 0 6px 0' }, children: "\uD83D\uDCCB Analysierter Text:" }), _jsxs("p", { style: { fontSize: '12px', color: '#333', margin: 0, whiteSpace: 'pre-wrap' }, children: [textToAnalyze.substring(0, 200), textToAnalyze.length > 200 ? '...' : ''] })] }), _jsxs("div", { style: {
                            padding: '15px',
                            background: verdictConfig[result.verdict].bgColor,
                            borderLeft: `4px solid ${verdictConfig[result.verdict].color}`,
                            borderRadius: '6px',
                            marginBottom: '12px'
                        }, children: [_jsx("div", { style: {
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: verdictConfig[result.verdict].color,
                                    marginBottom: '5px'
                                }, children: verdictConfig[result.verdict].text }), _jsxs("div", { style: {
                                    fontSize: '12px',
                                    color: '#666',
                                    marginTop: '8px',
                                    fontWeight: '500'
                                }, children: ["Analysiert mit: ", result.provider] })] }), _jsxs("div", { style: {
                            background: '#f9f9f9',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: '#333',
                            maxHeight: '150px',
                            overflowY: 'auto'
                        }, children: [_jsx("p", { style: { margin: '0 0 8px 0', fontWeight: '600', color: '#1976d2' }, children: "\uD83D\uDCAD Begr\u00FCndung:" }), _jsx("p", { style: { margin: 0, whiteSpace: 'pre-wrap' }, children: parseMarkdown(result.reasoning) })] })] })), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: handleAnalyze, disabled: isLoading || !textToAnalyze || !!result, style: {
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
                        }, children: "\uD83D\uDE80 Analysieren" }), result && (_jsx("button", { onClick: handleClear, style: {
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
                        }, children: "\uD83D\uDD04 Neuer Text" }))] }), _jsx("div", { style: {
                    marginTop: '15px',
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '10px'
                }, children: _jsx("a", { href: "#", onClick: () => chrome.runtime.openOptionsPage(), style: {
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontSize: '12px'
                    }, children: "\u2699\uFE0F Einstellungen" }) }), _jsx("style", { children: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      ` })] }));
};
