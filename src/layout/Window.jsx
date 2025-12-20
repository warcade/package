import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { componentRegistry } from '../api/plugin/registry';
import { windowManager } from '../api/window';

/**
 * Floating window component
 *
 * Renders a draggable, resizable window that displays a plugin component.
 * Used internally by WindowLayer.
 *
 * @param {object} props
 * @param {string} props.windowId - Window ID
 * @param {string} props.componentId - Component to render
 * @param {string} props.title - Window title
 * @param {number} props.x - X position
 * @param {number} props.y - Y position
 * @param {number} props.width - Window width
 * @param {number} props.height - Window height
 * @param {number} props.minWidth - Minimum width
 * @param {number} props.minHeight - Minimum height
 * @param {number} props.zIndex - Z-index for stacking
 */
export function Window(props) {
    const [isDragging, setIsDragging] = createSignal(false);
    const [isResizing, setIsResizing] = createSignal(false);
    const [resizeDirection, setResizeDirection] = createSignal(null);

    let dragStart = { x: 0, y: 0, windowX: 0, windowY: 0 };
    let resizeStart = { x: 0, y: 0, width: 0, height: 0, windowX: 0, windowY: 0 };

    // Get the component from registry
    const component = () => componentRegistry.get(props.componentId);

    // Handle mouse down on title bar (start drag)
    const handleDragStart = (e) => {
        if (e.target.closest('button')) return; // Don't drag when clicking buttons
        e.preventDefault();
        setIsDragging(true);
        dragStart = {
            x: e.clientX,
            y: e.clientY,
            windowX: props.x,
            windowY: props.y
        };
        windowManager.focus(props.windowId);
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    };

    // Handle mouse down on resize handle
    const handleResizeStart = (direction) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: props.width,
            height: props.height,
            windowX: props.x,
            windowY: props.y
        };
        windowManager.focus(props.windowId);

        // Set cursor based on direction
        const cursors = {
            n: 'ns-resize',
            s: 'ns-resize',
            e: 'ew-resize',
            w: 'ew-resize',
            ne: 'nesw-resize',
            nw: 'nwse-resize',
            se: 'nwse-resize',
            sw: 'nesw-resize'
        };
        document.body.style.cursor = cursors[direction];
        document.body.style.userSelect = 'none';
    };

    // Handle mouse move
    const handleMouseMove = (e) => {
        if (isDragging()) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            let newX = dragStart.windowX + deltaX;
            let newY = dragStart.windowY + deltaY;

            // Constrain to viewport (keep at least 100px of window visible)
            newX = Math.max(-props.width + 100, Math.min(window.innerWidth - 100, newX));
            newY = Math.max(0, Math.min(window.innerHeight - 40, newY));

            windowManager.setPosition(props.windowId, newX, newY);
        }

        if (isResizing()) {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;
            const dir = resizeDirection();

            let newWidth = resizeStart.width;
            let newHeight = resizeStart.height;
            let newX = resizeStart.windowX;
            let newY = resizeStart.windowY;

            // Calculate new dimensions based on resize direction
            if (dir.includes('e')) {
                newWidth = Math.max(props.minWidth, resizeStart.width + deltaX);
            }
            if (dir.includes('w')) {
                const widthDelta = -deltaX;
                const possibleWidth = resizeStart.width + widthDelta;
                if (possibleWidth >= props.minWidth) {
                    newWidth = possibleWidth;
                    newX = resizeStart.windowX + deltaX;
                }
            }
            if (dir.includes('s')) {
                newHeight = Math.max(props.minHeight, resizeStart.height + deltaY);
            }
            if (dir.includes('n')) {
                const heightDelta = -deltaY;
                const possibleHeight = resizeStart.height + heightDelta;
                if (possibleHeight >= props.minHeight) {
                    newHeight = possibleHeight;
                    newY = resizeStart.windowY + deltaY;
                }
            }

            windowManager.setPosition(props.windowId, newX, newY);
            windowManager.setSize(props.windowId, newWidth, newHeight);
        }
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    // Handle click to focus
    const handleWindowClick = () => {
        windowManager.focus(props.windowId);
    };

    // Handle close
    const handleClose = (e) => {
        e.stopPropagation();
        windowManager.close(props.windowId);
    };

    onMount(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    });

    const windowStyle = () => ({
        position: 'fixed',
        left: `${props.x}px`,
        top: `${props.y}px`,
        width: `${props.width}px`,
        height: `${props.height}px`,
        'z-index': props.zIndex,
        display: 'flex',
        'flex-direction': 'column'
    });

    // Resize handle styles
    const handleSize = 6;
    const cornerSize = 12;

    return (
        <div
            class="bg-base-100 rounded-lg shadow-2xl border border-base-300 overflow-hidden"
            style={windowStyle()}
            onMouseDown={handleWindowClick}
        >
            {/* Title bar */}
            <div
                class="flex items-center h-9 bg-base-200 border-b border-base-300 px-3 gap-2 flex-shrink-0 select-none"
                onMouseDown={handleDragStart}
            >
                <Show when={component()?.icon}>
                    <Dynamic component={component().icon} class="w-4 h-4 text-base-content/70" />
                </Show>
                <span class="flex-1 text-sm font-medium truncate text-base-content/90">
                    {props.title}
                </span>
                <button
                    class="w-6 h-6 rounded hover:bg-error/20 hover:text-error flex items-center justify-center transition-colors"
                    onClick={handleClose}
                    title="Close"
                >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div class="flex-1 overflow-auto min-h-0">
                <Show when={component()}>
                    <Dynamic component={component().component} />
                </Show>
            </div>

            {/* Resize handles */}
            {/* Edges */}
            <div
                class="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize hover:bg-primary/30"
                style={{ height: `${handleSize}px` }}
                onMouseDown={handleResizeStart('n')}
            />
            <div
                class="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize hover:bg-primary/30"
                style={{ height: `${handleSize}px` }}
                onMouseDown={handleResizeStart('s')}
            />
            <div
                class="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize hover:bg-primary/30"
                style={{ width: `${handleSize}px` }}
                onMouseDown={handleResizeStart('w')}
            />
            <div
                class="absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize hover:bg-primary/30"
                style={{ width: `${handleSize}px` }}
                onMouseDown={handleResizeStart('e')}
            />

            {/* Corners */}
            <div
                class="absolute top-0 left-0 cursor-nwse-resize hover:bg-primary/30"
                style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
                onMouseDown={handleResizeStart('nw')}
            />
            <div
                class="absolute top-0 right-0 cursor-nesw-resize hover:bg-primary/30"
                style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
                onMouseDown={handleResizeStart('ne')}
            />
            <div
                class="absolute bottom-0 left-0 cursor-nesw-resize hover:bg-primary/30"
                style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
                onMouseDown={handleResizeStart('sw')}
            />
            <div
                class="absolute bottom-0 right-0 cursor-nwse-resize hover:bg-primary/30"
                style={{ width: `${cornerSize}px`, height: `${cornerSize}px` }}
                onMouseDown={handleResizeStart('se')}
            />
        </div>
    );
}

export default Window;
