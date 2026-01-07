import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import ProductService from '../../services/productService';
import { toast } from 'react-toastify';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category: '',
    initialStock: 0,
    specifications: {
      metalType: 'GOLD',
      purity: '',
      weight: '',
      size: '',
    },
    status: 'ACTIVE',
  });

  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (product) {
      setFormData({
        ...product,
        category: product.category._id || product.category,
        price: product.price.toString(),
      });
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const data = await ProductService.getCategories();
      setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'specifications') {
        Object.keys(formData.specifications).forEach(specKey => {
          submissionData.append(`specifications[${specKey}]`, formData.specifications[specKey]);
        });
      } else {
        submissionData.append(key, formData[key]);
      }
    });

    images.forEach(image => {
      submissionData.append('images', image);
    });

    try {
      if (product) {
        await ProductService.updateProduct(product._id, submissionData);
        toast.success('Product updated successfully');
      } else {
        await ProductService.createProduct(submissionData);
        toast.success('Product created successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.toString());
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container glass">
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-sections">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-group flex-2">
                  <label>Product Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>SKU (Unique)</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
                {!product && (
                  <div className="form-group">
                    <label>Initial Stock</label>
                    <input type="number" name="initialStock" value={formData.initialStock} onChange={handleInputChange} />
                  </div>
                )}
                <div className="form-group flex-all">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Specifications</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Metal Type</label>
                  <select name="specifications.metalType" value={formData.specifications.metalType} onChange={handleInputChange}>
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Purity (e.g. 22K)</label>
                  <input type="text" name="specifications.purity" value={formData.specifications.purity} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Weight (g)</label>
                  <input type="number" step="0.01" name="specifications.weight" value={formData.specifications.weight} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Size</label>
                  <input type="text" name="specifications.size" value={formData.specifications.size} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Product Images</h3>
              <div className="image-upload-area">
                <div className="image-previews">
                  {images.map((img, idx) => (
                    <div key={idx} className="image-thumb-wrapper">
                      <img src={URL.createObjectURL(img)} alt="" />
                      <button type="button" onClick={() => removeImage(idx)} className="remove-img"><Plus size={14} /></button>
                    </div>
                  ))}
                  <label className="upload-box">
                    <Upload size={24} />
                    <span>Upload</span>
                    <input type="file" multiple onChange={handleFileChange} hidden />
                  </label>
                </div>
                <p className="upload-hint">Allowed formats: JPG, PNG, WEBP. Max size: 5MB per image.</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="gold-btn save-btn" disabled={loading}>
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
