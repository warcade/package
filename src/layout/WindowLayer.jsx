import { For } from 'solid-js';
import { Portal } from 'solid-js/web';
import { windows } from '../api/window';
import { Window } from './Window';

/**
 * WindowLayer - Container for all floating windows
 *
 * Place this in your App.jsx to enable floating windows.
 * Windows are rendered via Portal above the main layout.
 *
 * @example
 * function App() {
 *     return (
 *         <Engine>
 *             <LayoutRenderer />
 *             <WindowLayer />
 *         </Engine>
 *     );
 * }
 */
export function WindowLayer() {
    return (
        <Portal>
            <For each={Object.values(windows)}>
                {(win) => (
                    <Window
                        windowId={win.id}
                        componentId={win.componentId}
                        title={win.title}
                        x={win.x}
                        y={win.y}
                        width={win.width}
                        height={win.height}
                        minWidth={win.minWidth}
                        minHeight={win.minHeight}
                        zIndex={win.zIndex}
                    />
                )}
            </For>
        </Portal>
    );
}

export default WindowLayer;
