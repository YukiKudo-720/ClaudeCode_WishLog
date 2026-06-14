import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import ItemsList from '@/pages/ItemsList';
import ItemDetail from '@/pages/ItemDetail';
import ItemEdit from '@/pages/ItemEdit';
import TagList from '@/pages/TagList';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'items', element: <ItemsList /> },
      { path: 'items/new', element: <ItemEdit /> },
      { path: 'items/:id', element: <ItemDetail /> },
      { path: 'items/:id/edit', element: <ItemEdit /> },
      { path: 'tags', element: <TagList /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
