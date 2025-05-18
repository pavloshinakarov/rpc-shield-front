import { AppProps } from 'next/app';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId="486120804965-lupu29joed8uhf4gah5s65t6vsacp3d3.apps.googleusercontent.com">
      <>
        <Head>
          <title>RPC Shield</title>
        </Head>
        <Component {...pageProps} />
      </>
    </GoogleOAuthProvider>
  );
}
