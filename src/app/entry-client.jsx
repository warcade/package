import { render } from 'solid-js/web'
import * as SolidJS from 'solid-js'
import * as SolidJSWeb from 'solid-js/web'
import * as SolidJSStore from 'solid-js/store'
import * as WebArcade from '../index'
import * as WebArcadeUI from '../ui'
import App from './App'

// Expose SolidJS globally for runtime plugins
window.SolidJS = SolidJS
window.SolidJSWeb = SolidJSWeb
window.SolidJSStore = SolidJSStore

// Expose WebArcade API globally (combines main exports + UI components)
window.WebArcadeAPI = { ...WebArcade, ...WebArcadeUI }

const root = document.getElementById('root')

if (import.meta.hot) {
  import.meta.hot.dispose(() => root.textContent = '')
}

render(() => <App />, root)
