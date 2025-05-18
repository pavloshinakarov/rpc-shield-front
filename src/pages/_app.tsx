// pages/_app.tsx
import { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId="486120804965-lupu29joed8uhf4gah5s65t6vsacp3d3.apps.googleusercontent.com">
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}
