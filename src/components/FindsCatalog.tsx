'use client'; 

// ===================
// 1. IMPORTS & LIBRARIES
// ===================
import React, { useState, useEffect } from 'react';
import { MapPin, Copy, Check, Plus, Loader, Trash2, Edit2, X } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/ui/modal';
import { Find, NewFind } from '../types/finds';
import { findService } from '@/services/findservice';

// ==========================
// 2. INITIAL STATES & CONSTANTS
// ==========================
const initialFind: NewFind = {
  name: "",
  date: "",
  location: "",
  coordinates: "",
  what3words: "",
  depth: "",
  metalType: "",
  condition: "",
  notes: ""
};

// ========================
// 3. FINDS CATALOG COMPONENT
// ========================
const FindsCatalog: React.FC = () => {

  // ==================
  // 4. STATE DECLARATIONS
  // ==================
  const [finds, setFinds] = useState<Find[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [formData, setFormData] = useState<NewFind>(initialFind);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingFind, setEditingFind] = useState<Find | null>(null);

  // =====================
  // 5. EFFECTS & LOAD FINDS
  // =====================
  useEffect(() => {
    loadFinds();
  }, []);

  const loadFinds: () => Promise<void> = async () => {
    try {
      setIsLoading(true);
      const loadedFinds = await findService.getFinds();
      setFinds(loadedFinds);
      setError("");
    } catch (err) {
      setError("Failed to load finds. Please try again later.");
      console.error('Error loading finds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ====================
  // 6. HANDLER FUNCTIONS
  // ====================

  // Handle Delete Find
  const handleDelete = (e: React.MouseEvent, find: Find) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this find?')) return;
    setIsLoading(true);
    
    try {
      findService.deleteFind(find.id, find.imageUrl);
      setFinds(prevFinds => prevFinds.filter(f => f.id !== find.id));
      setIsLoading(false);
    } catch (err) {
      setError("Failed to delete find. Please try again.");
      console.error('Error deleting find:', err);
    }
  };

  // Toggle Form Visibility
  const handleShowForm: () => void = () => {
    setShowForm(!showForm);
    setEditingFind(null);
    setFormData(initialFind);
    setImagePreview("");
    setImageFile(null);
  };

  // Handle Edit Find
  const handleEdit = (e: React.MouseEvent, find: Find) => {
    e.stopPropagation();
    setEditingFind(find);
    setShowForm(true);
    setFormData({
      name: find.name,
      date: find.date,
      location: find.location,
      coordinates: find.coordinates,
      what3words: find.what3words,
      depth: find.depth,
      metalType: find.metalType,
      condition: find.condition,
      notes: find.notes
    });
  };

  // Handle Copy What3Words
  const handleCopyW3W: (words: string) => void = (words: string): void => {
    navigator.clipboard.writeText(words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Image Upload
  const handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate What3Words Format
  const validateWhat3Words: (words: string) => boolean = (words: string): boolean => {
    const regex = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;
    return regex.test(words);
  };

  // Handle Input Changes in Form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Submit Form
  const handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (formData.what3words && !validateWhat3Words(formData.what3words)) {
        alert("Please enter a valid what3words address (format: word.word.word)");
        return;
      }

      if (editingFind) {
        // Update existing find
        await findService.updateFind(editingFind.id, formData, imageFile || undefined);
        const updatedFinds = finds.map(f => 
          f.id === editingFind.id 
            ? { ...f, ...formData, imageUrl: imageFile ? URL.createObjectURL(imageFile) : f.imageUrl }
            : f
        );
        setFinds(updatedFinds);
      } else {
        // Create new find
        const savedFind = await findService.addFind(formData, imageFile || undefined);
        setFinds(prev => [savedFind, ...prev]);
      }
      
      setShowForm(false);
      setFormData(initialFind);
      setImagePreview("");
      setImageFile(null);
      setEditingFind(null);
      setError("");
    } catch (err) {
      setError("Failed to save find. Please try again.");
      console.error('Error in handleSubmit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Action
  const handleCancel: () => void = () => {
    setShowForm(false);
    setFormData(initialFind);
    setImagePreview("");
    setImageFile(null);
    setEditingFind(null);
  };

  // Handle Image Click to Enlarge
  const handleImageClick: (find: Find) => void = (find: Find) => {
    if (editingFind) {
      // Prevent image click during edit mode
      return;
    }
    setSelectedImage(find.imageUrl);
  };

  // =====================
  // 7. CONDITIONAL RENDERING
  // =====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading your finds...</span>
      </div>
    );
  }

  // =====================
  // 8. COMPONENT RENDERING
  // =====================
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* =================
      9. ERROR DISPLAY
      ================= */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

       {/* =================
      10. HEADER SECTION
      ================= */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white -mx-4 px-4 py-8 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Metal Detecting Finds Catalog</h1>
              <p className="mt-2 text-blue-100">Document and organize your discoveries</p>
            </div>
            <button
              onClick={handleShowForm}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              Add New Find
            </button>
          </div>
        </div>
      </div>

      {/* =================
      11. FORM SECTION
      ================= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingFind ? 'Edit Find' : 'Add New Find'}
              </h2>
              <button
                onClick={() => handleCancel()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Date Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date Found</label>
                <input
                  type="date"
                  name="date"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              {/* What3Words Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">what3words Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="what3words"
                    placeholder="word.word.word"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={formData.what3words}
                    onChange={handleInputChange}
                  />
                  <a 
                    href={`https://what3words.com/${formData.what3words}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <MapPin size={20} />
                  </a>
                </div>
              </div>

              {/* Depth Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Depth</label>
                <input
                  type="text"
                  name="depth"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.depth}
                  onChange={handleInputChange}
                />
              </div>

              {/* Metal Type Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Metal Type</label>
                <input
                  type="text"
                  name="metalType"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.metalType}
                  onChange={handleInputChange}
                />
              </div>

              {/* Condition Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Condition</label>
                <select
                  name="condition"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="">Select condition...</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Notes Field */}
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              {/* Photo Upload */}
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="col-span-2 flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white transition-colors ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isSubmitting ? 
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </div> 
                    : 
                    editingFind ? 'Update Find' : 'Save Find'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================
      14. FINDS LIST SECTION
      ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all">
        {finds.map((find) => (
          <div key={find.id} className="relative bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100">
            {/* Edit/Delete buttons - Make sure these are inside each card */}
            <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-90 hover:opacity-100">
              <button
                onClick={(e) => handleEdit(e, find)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-50 transform hover:scale-105 transition-all"
                title="Edit find"
              >
                <Edit2 className="text-blue-500" size={20} />
              </button>
              <button
                onClick={(e) => handleDelete(e, find)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transform hover:scale-105 transition-all"
                title="Delete find"
              >
                <Trash2 className="text-red-500" size={20} />
              </button>
            </div>
            {/* ========================
            15. FIND IMAGE SECTION
            ======================== */}
            <div 
              className="relative w-full h-48 cursor-pointer group"
              onClick={() => handleImageClick(find)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src={find.imageUrl || '/placeholder.png'}
                alt={find.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.png';
                }}
              />
              <div className="absolute bottom-2 left-2 z-20 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Click to enlarge
              </div>
            </div>

           
            {/* ========================
            16. FIND DETAILS SECTION
            ======================== */}
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{find.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{find.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://what3words.com/${find.what3words}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      {find.what3words}
                    </a>
                    <button
                      onClick={() => handleCopyW3W(find.what3words)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {copied ? 
                        <Check size={16} className="text-green-500" /> : 
                        <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                      }
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Found</span>
                    <span className="font-medium text-gray-700">{find.date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Depth</span>
                    <span className="font-medium text-gray-700">{find.depth}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Metal</span>
                    <span className="font-medium text-gray-700">{find.metalType}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Condition</span>
                    <span className="font-medium text-gray-700">{find.condition}</span>
                  </div>
                </div>

                {find.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-gray-600 text-sm italic">{find.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* =================
      17. IMAGE MODAL SECTION
      ================= */}
      {/* Image Modal */}
<Modal
  isOpen={!!selectedImage}
  onClose={() => setSelectedImage(null)}
>
  <div className="relative w-full h-[90vh]">
    <Image
      src={selectedImage || '/placeholder.png'}
      alt="Enlarged view"
      fill
      className="object-contain p-4"
      priority
      quality={100}
      sizes="(max-width: 768px) 100vw, 90vw"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder.png';
      }}
    />
  </div>
</Modal>
    </div>
  );
};

// ========================
// 18. EXPORT FINDS CATALOG
// ========================
export default FindsCatalog;