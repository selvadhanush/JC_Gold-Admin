import React, { useEffect, useState } from 'react';
import CategoryService from '../../services/categoryService';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Grid,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import './CategoryList.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await CategoryService.getCategories();
      setCategories(data.data);
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({ name: category.name, description: category.description || '', isActive: category.isActive });
    } else {
      setSelectedCategory(null);
      setFormData({ name: '', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await CategoryService.updateCategory(selectedCategory._id, formData);
        toast.success('Category updated successfully');
      } else {
        await CategoryService.createCategory(formData);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This might affect products in this category.')) {
      try {
        await CategoryService.deleteCategory(id);
        toast.success('Category deleted');
        fetchCategories();
      } catch (err) {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <div className="category-page">
      <div className="page-header-flex">
        <div className="page-header">
          <h1>Category Management</h1>
          <p>Organize your jewellery items into collections.</p>
        </div>
        <button className="gold-btn add-btn" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>Add New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat._id} className="category-card glass">
              <div className="category-info">
                <div className="category-icon-wrapper">
                  <Grid size={24} color="var(--text-gold)" />
                </div>
                <h2>{cat.name}</h2>
                <p>{cat.description || 'No description provided.'}</p>
                <span className={`status-badge ${cat.isActive ? 'active' : 'inactive'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="category-actions">
                <button className="icon-btn" onClick={() => handleOpenModal(cat)}>
                  <Edit2 size={18} />
                </button>
                <button className="icon-btn danger" onClick={() => handleDelete(cat._id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>{selectedCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g. Gold Necklaces"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Tell us about this collection..."
                />
              </div>
              <div className="form-group status-toggle">
                <label>Active</label>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="text-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="gold-btn">
                  {selectedCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
