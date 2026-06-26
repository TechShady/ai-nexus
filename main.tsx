import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { App } from './src/app/App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <IntlProvider locale="en" defaultLocale="en">
    <App />
  </IntlProvider>
);
