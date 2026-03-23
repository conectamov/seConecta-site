export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'seConecta — Conecte estudantes, multiplique oportunidades',
      meta: [
        { name: 'description', content: 'O seConecta é um ecossistema ed-tech que conecta estudantes a oportunidades e mobiliza uma rede de líderes estudantis que geram impacto.' },
        { name: 'theme-color', content: '#079272' },
        { name: 'application-name', content: 'seConecta' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'seConecta' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'seConecta' },
        { property: 'og:title', content: 'seConecta — Conecte estudantes, multiplique oportunidades' },
        { property: 'og:description', content: 'Encontre colegas com os mesmos objetivos acadêmicos e receba oportunidades de bolsas, estágios e editais personalizadas para o seu perfil.' },
        { property: 'og:image', content: 'https://seconecta.org/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'pt_BR' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'seConecta' },
        { name: 'twitter:description', content: 'Conecte-se com estudantes que pensam como você.' },
        { name: 'twitter:image', content: 'https://seconecta.org/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap' },
      ],
      script: [
        { src: 'https://kit.fontawesome.com/55ef797121.js', crossorigin: 'anonymous', defer: true },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.seconecta.org/api/v1',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'seConecta',
      short_name: 'seConecta',
      description: 'Conecte estudantes, multiplique oportunidades',
      theme_color: '#079272',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      lang: 'pt-BR',
      icons: [
        { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.seconecta\.org\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 8,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts' },
        },
      ],
    },
    devOptions: { enabled: false },
  },

  tailwindcss: {
    configPath: '~/tailwind.config.js',
  },

  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'https://api.seconecta.org',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
})
