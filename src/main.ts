import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { osmDatenLaden } from './data/osmStammdaten.js'
import { objektImportLaden } from './data/objektImport.js'

const root = document.querySelector('#app')
if (root) root.textContent = 'Lokale Gebietsdaten werden geladen …'
void Promise.all([osmDatenLaden(), objektImportLaden()]).finally(() => createApp(App).mount('#app'))
