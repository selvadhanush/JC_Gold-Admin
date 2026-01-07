import React, { useEffect, useState } from 'react';
import ProductService from '../../services/productService';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package, 
  Eye,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import './ProductList.css';

import ProductModal from './ProductModal';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await ProductService.getProducts({ 
        category: category || undefined,
        search: search || undefined
      });
      setProducts(data.data);
    } catch (err) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await ProductService.getCategories();
      setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchProducts();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await ProductService.updateStatus(id, newStatus);
      toast.success('Product status updated');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await ProductService.deleteProduct(id);
        toast.success('Product deleted');
        fetchProducts();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  const openAddModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="product-page">
      <div className="page-header-flex">
        <div className="page-header">
          <h1>Product Management</h1>
          <p>Inventory of {products.length} active jewellery items.</p>
        </div>
        <button className="gold-btn add-btn">
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="filter-bar glass">
        <div className="search-group">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by SKU or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <div className="filters">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <button className="filter-btn">
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      <div className="product-grid-view">
        {loading ? (
          <div className="loading-spinner">Fetching inventory...</div>
        ) : (
          <div className="table-container glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="td-product">
                        <img 
                          src={product.images[0] ? `http://localhost:5000${product.images[0]}` : '/placeholder-gold.jpg'} 
                          alt="" 
                          className="product-thumb"
                        />
                        <div className="product-meta">
                          <span className="product-name">{product.name}</span>
                          <span className="product-spec">{product.specifications?.metalType} • {product.specifications?.purity}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="sku-badge">{product.sku}</span></td>
                    <td>{product.category?.name}</td>
                    <td><span className="price-val">₹{product.price.toLocaleString()}</span></td>
                    <td>
                      <div className={`stock-status ${product.inventory?.quantity < 10 ? 'low' : ''}`}>
                        {product.inventory?.quantity || 0}
                        {product.inventory?.quantity < 10 && <AlertTriangle size={14} />}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`status-chip ${product.status.toLowerCase()}`}
                        onClick={() => toggleStatus(product._id, product.status)}
                      >
                        {product.status}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => openEditModal(product)}><Edit2 size={16} /></button>
                        <button className="icon-btn"><Eye size={16} /></button>
                        <button className="icon-btn danger" onClick={() => handleDelete(product._id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={fetchProducts}
      />
    </div>
  );
};

export default ProductList;
