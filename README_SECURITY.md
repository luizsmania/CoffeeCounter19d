# 🔐 Como Configurar API Keys com Segurança

## Para GitHub Pages (Client-Side)

### Opção 1: Manter no Código + Restringir nos Serviços (Recomendado)

1. **Mantenha as chaves no código** (já está assim)
2. **RESTRINGA as chaves nos serviços** (mais importante!):
   - Firebase: Configure HTTP referrer restrictions
   - OpenWeatherMap: Configure HTTP referrer restrictions

### Opção 2: Arquivo de Configuração Separado

1. Copie `config.example.js` para `config.js`
2. Adicione suas chaves reais em `config.js`
3. O arquivo `config.js` já está no `.gitignore`
4. Modifique os arquivos para importar de `config.js`:

```javascript
// firebase.js
import { firebaseConfig } from './config.js';
// ... usar firebaseConfig

// app.js  
import { WEATHER_API_KEY } from './config.js';
// ... usar WEATHER_API_KEY
```

**Nota**: Mesmo assim, as chaves aparecerão no bundle final. A restrição nos serviços é essencial.

## ⚠️ Importante

- **Client-side = chaves visíveis**: Em GitHub Pages, as chaves sempre aparecerão no código
- **Proteção real**: Restringir por domínio nos serviços
- **Para máxima segurança**: Use um backend proxy (requer servidor)

## 🚀 Quick Start

1. Configure as restrições de domínio no Firebase e OpenWeatherMap
2. Se quiser usar arquivo separado, siga a Opção 2 acima
3. Faça deploy normalmente

