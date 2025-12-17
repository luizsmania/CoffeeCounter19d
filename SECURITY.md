# 🔒 Segurança de API Keys - GitHub Pages

## ⚠️ Importante: Limitações de Client-Side

**GitHub Pages serve arquivos estáticos (HTML/CSS/JS)**, o que significa que:
- ❌ **Não é possível esconder completamente** as API keys do código final
- ✅ **MAS você pode proteger** restringindo as chaves nos serviços

## 🛡️ Soluções Recomendadas

### 1. **RESTRINGIR AS CHAVES NOS SERVIÇOS** (Mais Importante!)

#### Firebase:
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings** → **General**
3. Role até **Your apps** → Selecione seu app web
4. Em **API restrictions**, configure:
   - **HTTP referrers (web sites)**: Adicione apenas seus domínios
     - `https://seu-usuario.github.io/*`
     - `https://seu-dominio.com/*`
   - Isso impede que a chave seja usada em outros sites

#### OpenWeatherMap:
1. Acesse [OpenWeatherMap API Keys](https://home.openweathermap.org/api_keys)
2. Clique na sua chave
3. Configure **HTTP referrer restrictions**:
   - Adicione apenas: `https://seu-usuario.github.io/*`
4. Isso limita o uso da chave apenas ao seu domínio

### 2. **Usar Arquivo de Configuração Separado** (Opcional)

Crie um arquivo `config.js` (não commitado) e importe:

```javascript
// config.js (não commitado - adicione ao .gitignore)
export const firebaseConfig = { /* suas chaves */ };
export const WEATHER_API_KEY = 'sua-chave';
```

**Limitação**: Ainda aparecerá no código final, mas organiza melhor.

### 3. **Backend Proxy** (Melhor Segurança - Requer Servidor)

Para máxima segurança, crie um backend que faz as requisições:

```
Frontend → Seu Backend → OpenWeatherMap API
```

Isso esconde completamente a chave, mas requer um servidor (não funciona só com GitHub Pages).

## 📋 Checklist de Segurança

- [ ] ✅ Restringir Firebase API key por HTTP referrer
- [ ] ✅ Restringir OpenWeatherMap API key por HTTP referrer  
- [ ] ✅ Adicionar `config.js` ao `.gitignore` (se usar)
- [ ] ✅ Não commitar chaves reais no código
- [ ] ✅ Usar `config.example.js` como template
- [ ] ⚠️ Entender que em client-side, as chaves ainda serão visíveis no código

## 🔍 Verificação

Após fazer deploy, verifique:
1. Abra o DevTools (F12) → Network
2. Veja as requisições - as chaves estarão visíveis
3. **Isso é normal para client-side**, mas as restrições de domínio protegem

## 📚 Recursos

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [OpenWeatherMap API Security](https://openweathermap.org/api/security)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

