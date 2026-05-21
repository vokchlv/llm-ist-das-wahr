import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const OptionsApp = () => {
    const [selectedProvider, setSelectedProvider] = useState('pollinations');
    const [apiKeys, setApiKeys] = useState({
        openai: { key: '', model: 'gpt-3.5-turbo' },
        anthropic: { key: '', model: 'claude-3-sonnet-20240229' },
        gemini: { key: '', model: 'gemini-2.0-flash' },
        pollinations: { key: '', model: 'default' }
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const providers = [
        { id: 'pollinations', name: 'Pollinations.ai (Kostenlos)' },
        { id: 'openai', name: 'OpenAI (GPT)' },
        { id: 'anthropic', name: 'Anthropic (Claude)' },
        { id: 'gemini', name: 'Google Gemini' }
    ];
    const models = {
        openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        anthropic: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        gemini: ['gemini-3.1-flash-lite', 'gemini-3.1-pro', 'gemini-3-flash'],
        pollinations: ['default']
    };
    useEffect(() => {
        loadOptions();
    }, []);
    const loadOptions = async () => {
        try {
            const data = await chrome.storage.local.get('extensionConfig');
            if (data.extensionConfig) {
                const config = data.extensionConfig;
                setSelectedProvider(config.selectedProvider || 'pollinations');
                setApiKeys(config.apiKeys || {
                    openai: { key: '', model: 'gpt-3.5-turbo' },
                    anthropic: { key: '', model: 'claude-3-sonnet-20240229' },
                    gemini: { key: '', model: 'gemini-3.1-flash-lite' },
                    pollinations: { key: '', model: 'default' }
                });
            }
        }
        catch (err) {
            console.error('Error loading options:', err);
        }
    };
    const handleKeyChange = (provider, newKey) => {
        setApiKeys(prev => ({
            ...prev,
            [provider]: { ...prev[provider], key: newKey }
        }));
    };
    const handleModelChange = (provider, newModel) => {
        setApiKeys(prev => ({
            ...prev,
            [provider]: { ...prev[provider], model: newModel }
        }));
    };
    const handleSave = async () => {
        // Pollinations doesn't require a key, others do
        const activeProvider = selectedProvider;
        if (activeProvider !== 'pollinations' && !apiKeys[activeProvider]?.key?.trim()) {
            setErrorMessage(`Bitte gebe einen API-Key für ${activeProvider} ein`);
            setSuccessMessage('');
            return;
        }
        try {
            const config = { selectedProvider, apiKeys };
            await chrome.storage.local.set({ extensionConfig: config });
            setSuccessMessage('Einstellungen gespeichert');
            setErrorMessage('');
            setTimeout(() => setSuccessMessage(''), 2000);
        }
        catch (err) {
            setErrorMessage(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
            setSuccessMessage('');
        }
    };
    return (_jsxs("div", { style: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '700px',
            margin: '0 auto',
            padding: '30px 20px',
            background: '#f5f5f5',
            minHeight: '100vh'
        }, children: [_jsx("h1", { style: { color: '#333', marginBottom: '10px' }, children: "Erweiterungseinstellungen" }), _jsx("p", { style: { color: '#666', marginBottom: '30px' }, children: "Konfiguriere API-Keys f\u00FCr jeden Provider" }), successMessage && (_jsx("div", { style: {
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    borderLeft: '4px solid #2e7d32'
                }, children: successMessage })), errorMessage && (_jsx("div", { style: {
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    borderLeft: '4px solid #c62828'
                }, children: errorMessage })), _jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    marginBottom: '20px'
                }, children: providers.map(provider => (_jsx("button", { onClick: () => setSelectedProvider(provider.id), style: {
                        padding: '15px',
                        border: selectedProvider === provider.id ? '2px solid #1976d2' : '2px solid #ddd',
                        background: selectedProvider === provider.id ? '#e3f2fd' : 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: selectedProvider === provider.id ? '600' : '500',
                        color: selectedProvider === provider.id ? '#1976d2' : '#333',
                        transition: 'all 0.2s',
                        fontSize: '13px'
                    }, children: provider.name }, provider.id))) }), _jsxs("div", { style: {
                    background: 'white',
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '20px'
                }, children: [_jsx("h2", { style: { fontSize: '18px', marginBottom: '5px' }, children: providers.find(p => p.id === selectedProvider)?.name }), selectedProvider === 'pollinations' && (_jsx("p", { style: { fontSize: '12px', color: '#666', marginBottom: '20px' }, children: "Pollinations.ai ist kostenlos und ben\u00F6tigt keinen API-Key." })), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }, children: "API-Key:" }), _jsx("input", { type: "password", value: apiKeys[selectedProvider]?.key || '', onChange: (e) => handleKeyChange(selectedProvider, e.target.value), placeholder: selectedProvider === 'pollinations' ? '(Optional)' : 'API-Key eingeben...', style: {
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                } }), _jsxs("small", { style: { display: 'block', marginTop: '8px', color: '#999', fontSize: '12px' }, children: [selectedProvider === 'pollinations' && 'Kostenlos - kein Key nötig', selectedProvider === 'openai' && 'Den Key erhalten Sie unter platform.openai.com', selectedProvider === 'anthropic' && 'Den Key erhalten Sie unter console.anthropic.com', selectedProvider === 'gemini' && 'Den Key erhalten Sie unter ai.google.dev'] })] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }, children: "Modell:" }), _jsx("select", { value: apiKeys[selectedProvider]?.model || '', onChange: (e) => handleModelChange(selectedProvider, e.target.value), style: {
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }, children: models[selectedProvider]?.map((m) => (_jsx("option", { value: m, children: m }, m))) })] }), _jsxs("div", { style: {
                            background: '#f0f7ff',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #1976d2',
                            fontSize: '12px',
                            color: '#333'
                        }, children: [selectedProvider === 'pollinations' && (_jsx("p", { children: "Pollinations.ai bietet kostenlose AI-Modelle ohne API-Key. Die Ergebnisse k\u00F6nnen jedoch variieren." })), selectedProvider === 'openai' && (_jsx("p", { children: "OpenAI bietet zwar zahlpflichtige, aber sehr zuverl\u00E4ssige Modelle." })), selectedProvider === 'anthropic' && (_jsx("p", { children: "Anthropic Claude ist bekannt f\u00FCr hohe Qualit\u00E4t und Sicherheit." })), selectedProvider === 'gemini' && (_jsx("p", { children: "Google Gemini ist schnell und bietet kostenlose API Token zur Verwendung an." }))] })] }), _jsx("button", { onClick: handleSave, style: {
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
                }, onMouseEnter: (e) => e.currentTarget.style.background = '#45a049', onMouseLeave: (e) => e.currentTarget.style.background = '#4CAF50', children: "Einstellungen speichern" }), _jsxs("div", { style: {
                    background: '#fff3e0',
                    padding: '15px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #FF9800',
                    fontSize: '12px',
                    color: '#333'
                }, children: [_jsx("h3", { style: { marginBottom: '10px', fontSize: '13px' }, children: "Alle Provider:" }), _jsxs("ul", { style: { margin: 0, paddingLeft: '20px', lineHeight: '1.8' }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Pollinations.ai:" }), " Kostenlos, kein Key"] }), _jsxs("li", { children: [_jsx("strong", { children: "OpenAI:" }), " ", _jsx("a", { href: "https://platform.openai.com/api-keys", target: "_blank", rel: "noreferrer", style: { color: '#1976d2' }, children: "platform.openai.com" })] }), _jsxs("li", { children: [_jsx("strong", { children: "Anthropic:" }), " ", _jsx("a", { href: "https://console.anthropic.com", target: "_blank", rel: "noreferrer", style: { color: '#1976d2' }, children: "console.anthropic.com" })] }), _jsxs("li", { children: [_jsx("strong", { children: "Google Gemini:" }), " ", _jsx("a", { href: "https://ai.google.dev", target: "_blank", rel: "noreferrer", style: { color: '#1976d2' }, children: "ai.google.dev" })] })] })] })] }));
};
