import React from 'react';
import { AppRouter } from './routes';
import Layout from './components/layout/Layout';

const App: React.FC = () => {
  return (
    <Layout>
      <AppRouter />
    </Layout>
  );
};

export default App;
