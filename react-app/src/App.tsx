import { useState, useEffect } from 'react'

// Declare GraalVM global
declare global {
    interface Window {
        GraalVM: any;
    }
}

// Singleton log interceptor
let isConsoleIntercepted = false;
const logListeners: ((msg: string) => void)[] = [];

const setupConsoleInterceptor = () => {
    if (isConsoleIntercepted) return;
    isConsoleIntercepted = true;

    const originalLog = console.log;
    console.log = (...args: any[]) => {
        originalLog(...args);
        const msg = args.join(' ');
        if (msg.includes("RESULT:") || msg.includes("Startup Check:")) {
            logListeners.forEach(listener => listener(msg));
        }
    };
};

function App() {
    const [result, setResult] = useState<string>("");
    const [isReady, setIsReady] = useState(false);

    // Form state
    const [a, setA] = useState("10");
    const [b, setB] = useState("20");
    const [op, setOp] = useState("add");

    // wasmExports state is no longer needed as we're calling GraalVM.run directly
    // const [wasmExports, setWasmExports] = useState<any>(null);

    useEffect(() => {
        // subscribe to logs
        const handleLog = (msg: string) => {
            setResult(prev => msg + "\n" + prev);
        };
        logListeners.push(handleLog);
        setupConsoleInterceptor();

        const initWasm = async () => {
            try {
                if (window.GraalVM) {
                    console.log("GraalVM already loaded, initializing...");
                    await window.GraalVM.run([]);
                    setIsReady(true);
                    return;
                }

                if (document.getElementById('graalvm-loader')) {
                    console.log("GraalVM script already present.");
                    if (window.GraalVM) setIsReady(true);
                    return;
                }

                // Load the mathutils.js script
                const script = document.createElement('script');
                script.id = 'graalvm-loader'; // Assign an ID to track it
                script.src = '/mathutils.js';
                script.async = true;

                script.onload = async () => {
                    console.log("mathutils.js loaded", window.GraalVM);
                    if (window.GraalVM) {
                        // The script automatically runs main() once loaded
                        setIsReady(true);
                    }
                };

                document.body.appendChild(script);

                // We do NOT remove the script on cleanup to avoid reloading complexity/duplicates
                // document.body.removeChild(script); 

            } catch (err) {
                console.error("Error setting up WASM:", err);
                setResult("Error setting up WASM. Check console.");
            }
        };

        initWasm();

        return () => {
            // Unsubscribe
            const idx = logListeners.indexOf(handleLog);
            if (idx > -1) logListeners.splice(idx, 1);
        };
    }, []);

    const handleCalculate = async () => {
        if (!window.GraalVM) return; // Ensure GraalVM is loaded

        try {
            // Re-run the VM with arguments.
            // GraalVM WasmGC often allows invoking run() multiple times or we rely on re-entry.
            // We pass [op, a, b] as arguments to main(String[] args)
            console.log(`Calling GraalVM.run(["${op}", "${a}", "${b}"])`);
            await window.GraalVM.run([op, a, b]);
            // The result will be captured by the console.log interceptor
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
