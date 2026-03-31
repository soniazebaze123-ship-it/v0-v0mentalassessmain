import { ThemeProvider } from 'next-themes';

export const MyApp = ({ Component, pageProps }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Component {...pageProps} />
    </ThemeProvider>
  );
};