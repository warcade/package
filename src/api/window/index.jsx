import { createRoot } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

let windows, setWindows;
let nextZIndex = 1000;
let windowIdCounter = 0;

createRoot(() => {
    [windows, setWindows] = createStore({});
});

/**
 * Window Manager API
 *
 * Manage floating windows that can display plugin components.
 *
 * @example
 * // Open a window
 * const windowId = windowManager.open('my-plugin:my-panel', {
 *     title: 'My Panel',
 *     width: 400,
 *     height: 300
 * });
 *
 * // Focus a window (bring to front)
 * windowManager.focus(windowId);
 *
 * // Close a window
 * windowManager.close(windowId);
 */
export const windowManager = {
    /**
     * Open a new window
     * @param {string} componentId - Full component ID (pluginId:componentId)
     * @param {object} options - Window options
     * @param {string} [options.title] - Window title
     * @param {number} [options.width=400] - Initial width
     * @param {number} [options.height=300] - Initial height
     * @param {number} [options.x] - Initial x position (defaults to centered)
     * @param {number} [options.y] - Initial y position (defaults to centered)
     * @param {number} [options.minWidth=200] - Minimum width
     * @param {number} [options.minHeight=150] - Minimum height
     * @returns {string} Window ID
     */
    open(componentId, options = {}) {
        const id = `window-${++windowIdCounter}`;
        const width = options.width || 400;
        const height = options.height || 300;

        // Center window if no position specified
        const x = options.x ?? Math.max(50, (window.innerWidth - width) / 2);
        const y = options.y ?? Math.max(50, (window.innerHeight - height) / 2);

        const windowConfig = {
            id,
            componentId,
            title: options.title || componentId.split(':').pop(),
            x,
            y,
            width,
            height,
            minWidth: options.minWidth || 200,
            minHeight: options.minHeight || 150,
            zIndex: ++nextZIndex
        };

        setWindows(id, windowConfig);

        // Emit window opened event
        document.dispatchEvent(new CustomEvent('window:opened', {
            detail: { windowId: id, componentId }
        }));

        return id;
    },

    /**
     * Close a window
     * @param {string} windowId - Window ID
     */
    close(windowId) {
        const win = windows[windowId];
        if (win) {
            setWindows(produce(state => {
                delete state[windowId];
            }));

            // Emit window closed event
            document.dispatchEvent(new CustomEvent('window:closed', {
                detail: { windowId, componentId: win.componentId }
            }));
        }
    },

    /**
     * Close all windows for a specific plugin
     * @param {string} pluginId - Plugin ID
     */
    closeByPlugin(pluginId) {
        const toClose = Object.values(windows).filter(
            w => w.componentId.startsWith(`${pluginId}:`)
        );
        toClose.forEach(w => this.close(w.id));
    },

    /**
     * Focus a window (bring to front)
     * @param {string} windowId - Window ID
     */
    focus(windowId) {
        if (windows[windowId]) {
            setWindows(windowId, 'zIndex', ++nextZIndex);

            // Emit window focused event
            document.dispatchEvent(new CustomEvent('window:focused', {
                detail: { windowId }
            }));
        }
    },

    /**
     * Update window position
     * @param {string} windowId - Window ID
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    setPosition(windowId, x, y) {
        if (windows[windowId]) {
            setWindows(windowId, { x, y });
        }
    },

    /**
     * Update window size
     * @param {string} windowId - Window ID
     * @param {number} width - New width
     * @param {number} height - New height
     */
    setSize(windowId, width, height) {
        if (windows[windowId]) {
            const win = windows[windowId];
            setWindows(windowId, {
                width: Math.max(width, win.minWidth),
                height: Math.max(height, win.minHeight)
            });
        }
    },

    /**
     * Get a window by ID
     * @param {string} windowId - Window ID
     * @returns {object|undefined} Window config
     */
    get(windowId) {
        return windows[windowId];
    },

    /**
     * Get all open windows
     * @returns {object[]} Array of window configs
     */
    getAll() {
        return Object.values(windows);
    },

    /**
     * Check if a window is open
     * @param {string} windowId - Window ID
     * @returns {boolean}
     */
    isOpen(windowId) {
        return !!windows[windowId];
    },

    /**
     * Get reactive signals for use in components
     */
    signals: {
        windows: () => windows,
        getAll: () => Object.values(windows),
        count: () => Object.keys(windows).length
    }
};

export { windows, setWindows };
export default windowManager;
