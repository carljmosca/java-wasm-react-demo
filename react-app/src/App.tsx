import { useState, useEffect } from 'react'

// Declare GraalVM global
declare global {
    interface Window {
        GraalVM: any;
    }
}

function App() {
    const [result, setResult] = useState<string>("");
    const [isReady, setIsReady] = useState(false);

    // Form state
    const [a, setA] = useState("10");
    const [b, setB] = useState("20");
    const [op, setOp] = useState("add");

    useEffect(() => {
        const initWasm = async () => {
            try {
                // Intercept console.log to capture Java output
                const originalLog = console.log;
                console.log = (...args) => {
                    originalLog(...args);
                    const msg = args.join(' ');
                    // Capture lines starting with specific keywords
                    if (msg.includes("RESULT:") || msg.includes("Startup Check:")) {
                        setResult(prev => msg + "\n" + prev);
                    }
                };

                // Load the mathutils.js script
                const script = document.createElement('script');
                script.src = '/mathutils.js';
                script.async = true;

                script.onload = async () => {
                    console.log("mathutils.js loaded", window.GraalVM);
                    if (window.GraalVM) {
                        try {
                            // Initial startup run (calls main([]) which prints "Hello...")
                            await window.GraalVM.run([]);
                            setIsReady(true);
                        } catch (e) {
                            console.error("Error running GraalVM:", e);
                            setResult("Error running GraalVM: " + e);
                        }
                    }
                };

                document.body.appendChild(script);

                return () => {
                    document.body.removeChild(script);
                    console.log = originalLog;
                };

            } catch (err) {
                console.error("Error setting up WASM:", err);
                setResult("Error setting up WASM. Check console.");
            }
        };

        if (!window.GraalVM) {
            initWasm();
        }
    }, []);

    const handleCalculate = async () => {
        if (!window.GraalVM) return;

        try {
            // Re-run the VM with arguments. 
            // GraalVM WasmGC often allows invoking run() multiple times or we rely on re-entry.
            // We pass [op, a, b] as arguments to main(String[] args)
            console.log(`Calling GraalVM.run(["${op}", "${a}", "${b}"])`);
            await window.GraalVM.run([op, a, b]);
        } catch (e) {
            console.error("Error executing:", e);
            setResult(`Error: ${e}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Java WASM Calculator (GraalVM 25)</h1>

            <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Operation:</label>
                    <select
                        value={op}
                        onChange={e => setOp(e.target.value)}
                        style={{ padding: '8px', width: '100%' }}
                    >
                        <option value="add">Add (+)</option>
                        <option value="multiply">Multiply (*)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Value A:</label>
                        <input
                            type="number"
                            value={a}
                            onChange={e => setA(e.target.value)}
                            style={{ padding: '8px', width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Value B:</label>
                        <input
                            type="number"
                            value={b}
                            onChange={e => setB(e.target.value)}
                            style={{ padding: '8px', width: '100%' }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    disabled={!isReady}
                    style={{
                        padding: '12px 20px',
                        cursor: isReady ? 'pointer' : 'not-allowed',
                        background: isReady ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '100%',
                        fontSize: '1.1em'
                    }}
                >
                    {isReady ? "Calculate" : "Loading WASM..."}
                </button>

                <div style={{ marginTop: '20px' }}>
                    <h3>Results:</h3>
                    <pre style={{
                        background: '#333',
                        color: '#0f0',
                        padding: '10px',
                        borderRadius: '4px',
                        minHeight: '100px',
                        overflowX: 'auto'
                    }}>
                        {result || "Waiting for input..."}
                    </pre>
                </div>

                <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
                    Open Developer Console to see raw logs from Java.
                </p>
            </div>
        </div>
    )
}

export default App
