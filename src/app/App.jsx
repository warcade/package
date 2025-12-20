import { onMount } from 'solid-js';
import './base.css';
import { Engine } from '../api/plugin';
import { LayoutRenderer } from '../layout/LayoutRenderer';
import { WindowLayer } from '../layout/WindowLayer';
import DevNotice from '../components/DevNotice';
import PluginInstaller from '../components/PluginInstaller';

export default function App() {
    onMount(async () => {
        // Initialize theme from localStorage
        const theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        // Setup window close handling
        if (window.__WEBARCADE__) {
            window.__WEBARCADE__.event.listen('window-close-requested', async () => {
                // Handle close request
            });
        }
    });

    return (
        <Engine>
            <PluginInstaller />
            <div class="w-full h-full relative">
                <LayoutRenderer />
                <WindowLayer />
                <DevNotice />
            </div>
        </Engine>
    );
}
