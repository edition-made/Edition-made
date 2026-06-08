import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminAuth, { isAdminAuthenticated } from './AdminAuth';
import AdminLayout from './AdminLayout';
import Dashboard from './pages/Dashboard';
import ProductsAdmin from './pages/ProductsAdmin';
import ProductForm from './pages/ProductForm';
import BlogAdmin from './pages/BlogAdmin';
import BlogPostForm from './pages/BlogPostForm';
import CRMAdmin from './pages/CRMAdmin';
import ContactsAdmin from './pages/ContactsAdmin';
import StockAdmin from './pages/StockAdmin';
import AccountingAdmin from './pages/AccountingAdmin';
import CategoriesAdmin from './pages/CategoriesAdmin';

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());

  if (!authed) {
    return <AdminAuth onSuccess={() => setAuthed(true)} />;
  }

  return (
    <AdminLayout onLogout={() => setAuthed(false)}>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="produits" element={<ProductsAdmin />} />
        <Route path="produits/:id" element={<ProductForm />} />
        <Route path="blog" element={<BlogAdmin />} />
        <Route path="blog/:id" element={<BlogPostForm />} />
        <Route path="crm" element={<CRMAdmin />} />
        <Route path="contacts" element={<ContactsAdmin />} />
        <Route path="stock" element={<StockAdmin />} />
        <Route path="comptabilite" element={<AccountingAdmin />} />
        <Route path="categories" element={<CategoriesAdmin />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
