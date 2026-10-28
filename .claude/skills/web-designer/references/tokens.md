# Шаблон дизайн-токенов

```css
:root {
  /* Цвет */
  --color-bg: #fafaf7;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-text-muted: #5c5c5c;
  --color-border: #e3e1da;
  --color-primary: #1f4fd8;
  --color-primary-contrast: #ffffff;
  --color-accent: #e8590c;
  --color-success: #2b8a3e;
  --color-warning: #e67700;
  --color-error: #c92a2a;
  --focus-ring: 0 0 0 3px color-mix(in srgb, var(--color-primary) 40%, transparent);

  /* Типографика */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-sans);
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  --text-2xl: clamp(2rem, 1.4rem + 2.4vw, 3.25rem);
  --text-hero: clamp(2.5rem, 1.5rem + 4vw, 4.5rem);
  --leading-body: 1.55;
  --leading-heading: 1.15;

  /* Отступы (4/8 px) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;
  --space-12: 3rem;   --space-16: 4rem;  --space-24: 6rem;

  /* Форма и глубина */
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 8px 24px rgb(0 0 0 / 0.08);

  /* Движение */
  --ease: cubic-bezier(0.2, 0, 0, 1);
  --duration: 200ms;

  /* Макет */
  --container: 72rem;
  --gutter: clamp(1rem, 4vw, 2rem);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #121212; --color-surface: #1c1c1c;
    --color-text: #f2f2f2; --color-text-muted: #a8a8a8;
    --color-border: #2e2e2e;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
```

Подстрой значения под бренд: меняй палитру и шрифты, сохраняя структуру и имена токенов.
