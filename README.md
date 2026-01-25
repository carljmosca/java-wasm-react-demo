# Java WASM React Demo (GraalVM 25)

This project demonstrates how to run Java code in the browser using WebAssembly (WasmGC), compiled with **GraalVM 25.0.1**, and integrated into a **React** application.

## 🚀 Quick Start

This project is configured to run inside a DevContainer which provides all necessary tools (Java 25, Maven, Node.js).

1.  **Build and Setup**:
    Run the automated setup script to compile the Java code and prepare the React assets:
    ```bash
    ./setup.sh
    ```

2.  **Run the Application**:
    Start the React development server:
    ```bash
    cd react-app
    npm run dev
    ```

3.  **View**: Open your browser (usually at `http://localhost:5173`) to interact with the calculator.

---

## 🏗 Architecture

*   **`java-wasm/`**: Contains the functionality to be compiled to WebAssembly.
    *   `src/main/java/com/example/Math.java`: The core logic.
    *   Build uses `native-maven-plugin` with the `--tool:svm-wasm` argument.
*   **`react-app/`**: A Vite + React + TypeScript frontend.
    *   `src/App.tsx`: Manages the WASM lifecycle and UI.
    *   Loads the GraalVM-generated `mathutils.js` loader.

---

## ❓ Why aren't `add` and `multiply` exported directly?

You might notice that we invoke the logic via `GraalVM.run(["add", "10", "20"])` (which calls the Java `main` method) instead of calling `exports.add(10, 20)` directly.

### The Reason: GraalVM WasmGC Backend
This project uses the experimental **WasmGC (WebAssembly Garbage Collection)** backend provided by GraalVM 25 (`--tool:svm-wasm`).

*   **Traditional Native Image**: When compiling to native machine code (or the legacy WASM backend), GraalVM supports the C-API. functions annotated with `@CEntryPoint` are exported as standard C-style symbols, callable directly by host applications.
*   **WasmGC Backend**: This new backend targets the managed ecosystem of the browser. Currently, it is designed primarily to execute **Java Applications** (starting from a `main` entry point) rather than serving as a **Shared Library**.
    *   The build process optimizes heavily for the execution of `main`.
    *   While `@CEntryPoint` metadata is generated (visible in the logs), the functions are not exposed as simple top-level WASM exports in the `instance.exports` object in a way that is easily callable significantly differing from the C-ABI.
    *   **Known Issue**: See [GraalVM Issue #11122](https://github.com/oracle/graal/issues/11122) for ongoing discussions and tracking of this limitation.
    *   Passing complex types (like Objects or Strings) between JS and WasmGC Java currently requires the specific GraalVM loader (`mathutils.js`) to handle the object graph, and the `main` method is the primary supported interface for this interaction in the preview version.

### 🔮 Future Outlook
Support for WasmGC is rapidly evolving. We expect the following improvements in future GraalVM releases:

1.  **WASM Component Model (WASI Preview 2)**: Standardized exports where Java methods can be exposed as "Interfaces" in a WASM component, allowing natural calling from JS without a `main` dispatcher.
2.  **Enhanced Interop API**: Improved annotations (likely standard `@Export` or specific `js-interop` libraries) to expose individual static methods directly to the `GraalVM` JavaScript runtime object.

### Current Workaround
We implement a **Dispatcher Pattern** in `Math.java`:
```java
public static void main(String[] args) {
    // Parse args[0] to decide which function to call
    if ("add".equalsIgnoreCase(args[0])) { ... }
}
```
This allow us to reliably invoke any logic we want using the stable `GraalVM.run(args)` API.
