import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Plus, Trash2, Image as ImageIcon, AlertCircle, Layers, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

// Supported fixed GSM choices for Raw Material products
const FIXED_GSM_CHOICES = [80, 90, 100, 120, 140];

const ProductFormModal = ({ isOpen, onClose, productToEdit, categories, onProductSaved }) => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    weight: '',
    gsm: 100,
    base_price: '0.00',
    description: '',
    is_active: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Global GSM Prices table for live calculation preview
  const [globalGsmPrices, setGlobalGsmPrices] = useState([]);

  // Disposable Product Variants state
  const [variants, setVariants] = useState([
    { variant_name: 'Standard - 100 Pcs/Bori', unit_packing: '100 pcs/bori', price: '450.00', stock: 50, is_active: true }
  ]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Global GSM prices for live admin price preview
  useEffect(() => {
    const fetchGsmPrices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/gsm-prices/`);
        if (res.ok) {
          const data = await res.json();
          setGlobalGsmPrices(data);
        }
      } catch (err) {
        console.warn('Error fetching global GSM prices for form preview:', err);
      }
    };
    if (isOpen) {
      fetchGsmPrices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || (categories[0]?.id || ''),
        size: productToEdit.size || '',
        weight: productToEdit.weight ? String(productToEdit.weight) : '',
        gsm: productToEdit.gsm || (productToEdit.gsms?.[0]?.gsm || 100),
        base_price: productToEdit.base_price || '0.00',
        description: productToEdit.description || '',
        is_active: productToEdit.is_active ?? true,
      });
      setImagePreview(productToEdit.image_url || null);
      setImageFile(null);
      setVariants(productToEdit.variants?.length ? productToEdit.variants : []);
    } else {
      setFormData({
        name: '',
        category: categories[0]?.id || '',
        size: '',
        weight: '',
        gsm: 100,
        base_price: '0.00',
        description: '',
        is_active: true,
      });
      setImagePreview(null);
      setImageFile(null);
      setVariants([
        { variant_name: 'Standard - 100 Pcs/Bori', unit_packing: '100 pcs/bori', price: '450.00', stock: 50, is_active: true }
      ]);
    }
    setError('');
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === parseInt(formData.category));
  const isRawMaterial = selectedCategory?.category_type === 'RAW_MATERIAL';

  // Live GSM Rate and Calculated Price calculation
  const currentGsmObj = globalGsmPrices.find((g) => g.gsm === parseInt(formData.gsm));
  const currentGsmRate = currentGsmObj ? parseFloat(currentGsmObj.price || 0) : 0;
  const weightNum = parseFloat(formData.weight || 0);
  const calculatedPricePreview = (currentGsmRate > 0 && weightNum > 0) 
    ? (currentGsmRate * weightNum).toFixed(2) 
    : null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { variant_name: '', unit_packing: '', price: '0.00', stock: 0, is_active: true }
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product name cannot be empty.');
      return;
    }

    if (!formData.category) {
      setError('Please select a category.');
      return;
    }

    // Validation for Disposable products
    if (!isRawMaterial) {
      if (parseFloat(formData.base_price) < 0) {
        setError('Base price cannot be negative.');
        return;
      }

      for (let i = 0; i < variants.length; i++) {
        if (!variants[i].variant_name.trim()) {
          setError(`Variant #${i + 1} requires a variant name.`);
          return;
        }
        if (parseFloat(variants[i].price) < 0 || parseInt(variants[i].stock) < 0) {
          setError(`Variant #${i + 1} price and stock cannot be negative.`);
          return;
        }
      }
    }

    // Validation for Raw Material products (Weight must be numeric and > 0)
    if (isRawMaterial) {
      const parsedWeight = parseFloat(formData.weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        setError('Weight must be greater than 0 kg.');
        return;
      }
      if (!formData.gsm) {
        setError('Please select a GSM option for this raw material product.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const dataPayload = new FormData();
      dataPayload.append('name', formData.name);
      dataPayload.append('category', formData.category);
      dataPayload.append('size', formData.size);
      dataPayload.append('weight', isRawMaterial ? formData.weight : '');
      dataPayload.append('gsm', isRawMaterial ? formData.gsm : '');
      dataPayload.append('base_price', isRawMaterial ? '0.00' : formData.base_price);
      dataPayload.append('description', formData.description);
      dataPayload.append('is_active', formData.is_active);

      if (imageFile) {
        dataPayload.append('image', imageFile);
      }

      if (!isRawMaterial) {
        dataPayload.append('variants_json', JSON.stringify(variants));
      }

      const isEdit = !!productToEdit;
      const url = isEdit 
        ? `${API_BASE_URL}/products/${productToEdit.id}/` 
        : `${API_BASE_URL}/products/`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: dataPayload,
      });

      const resData = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        let errStr = 'Failed to save product.';
        if (typeof resData === 'object') {
          errStr = Object.values(resData).flat().join(' ');
        }
        throw new Error(errStr);
      }

      onProductSaved(resData);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {productToEdit ? 'Edit Product Details' : 'Add New Product'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                placeholder={isRawMaterial ? "e.g. Paper Roll" : "e.g. Paper Dona 8 Inch"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.category_type_display})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Size
              </label>
              <input
                type="text"
                placeholder={isRawMaterial ? "e.g. 36 × 48 inch" : "e.g. 8 inch, 10 inch, 400ml"}
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
              />
            </div>

            {isRawMaterial ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 25"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GSM *
                  </label>
                  <select
                    value={formData.gsm}
                    onChange={(e) => setFormData({ ...formData, gsm: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium bg-white"
                    required
                  >
                    {FIXED_GSM_CHOICES.map((gsmVal) => (
                      <option key={gsmVal} value={gsmVal}>
                        {gsmVal} GSM
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                />
              </div>
            )}

          </div>

          {/* Image Upload & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-1 text-xs">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-slate-400">JPG, PNG or WEBP up to 5MB.</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Product details, specs, food-grade features, or manufacturing roll parameters..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
            />
          </div>

          {/* SECTION SPECIFIC PRICING / GSM PREVIEW */}
          {isRawMaterial ? (
            /* RAW MATERIAL AUTOMATIC GSM PRICING PREVIEW */
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Automatic GSM Price Calculation</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded">Auto-Calculated</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Raw Material prices are automatically calculated as <strong className="text-indigo-700">GSM Price/kg × Weight (kg)</strong> from Central GSM Pricing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Calculated Product Price:</span>
                    <span className="text-xs text-slate-500">
                      {formData.gsm} GSM (₹{currentGsmRate.toFixed(2)}/kg) × {weightNum > 0 ? `${weightNum} kg` : '0 kg'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {calculatedPricePreview ? (
                    <span className="text-2xl font-black text-indigo-950">₹{calculatedPricePreview}</span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      {currentGsmRate === 0 ? 'GSM price not configured' : 'Enter valid weight (>0 kg)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* DISPOSABLE PRODUCTS QUALITY / BORI PACKING VARIANTS SECTION */
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Product Quality & Bori Packing Options
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define different quality grades & bori quantities (e.g. Silver 100 pcs/bori vs 200 pcs/bori).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center space-x-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>

              {/* Variants Inputs List */}
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Variant / Quality Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Silver Premium 100 Pcs"
                        value={v.variant_name}
                        onChange={(e) => handleVariantChange(idx, 'variant_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Packing Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100 pcs/bori"
                        value={v.unit_packing}
                        onChange={(e) => handleVariantChange(idx, 'unit_packing', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={v.price}
                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="grow">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Stock (Bori/Bags)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving Product...' : (productToEdit ? 'Update Product' : 'Save Product')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProductFormModal;
