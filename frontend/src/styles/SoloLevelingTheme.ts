// Theme configuration for the Solo Leveling inspired UI
export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#818cf8',
    background: '#f3f4f6',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
    }
  },
  fonts: {
    display: 'var(--sl-font-display)',
    body: 'var(--sl-font-body)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  }
};

export type Theme = typeof theme;

export default theme;
