import { createBrowserRouter } from 'react-router-dom';

const routes = [
  {
    path: '/',
    element: <div>Home Page</div>,
  },
];

export const router = createBrowserRouter(routes);
export default router;