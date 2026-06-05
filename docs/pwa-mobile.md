# PWA & mobile

## Înainte de build

După ce tragi ultimele modificări din git:

```bash
npm install --legacy-peer-deps
```

Fără acest pas, `npm run build` poate eșua cu `Cannot find package 'vite-plugin-pwa'`.

## Instalare PWA

După deploy (HTTPS obligatoriu):

1. Deschide site-ul în Chrome/Safari pe telefon
2. **Android Chrome:** meniu → „Adaugă pe ecranul de start”
3. **iOS Safari:** Share → „Add to Home Screen”

În dev (`npm run dev`) PWA-ul nu e activ — testează cu `npm run build && npm run preview`.

## Mobile

- Navigare inferioară fixă în app-ul autentificat (sub `md` breakpoint)
- Safe areas pentru notch/home indicator (`env(safe-area-inset-*)`)
- Layout responsive pe meciuri și formulare pronosticuri
