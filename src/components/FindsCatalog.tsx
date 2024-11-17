'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Copy, Check, Plus, Loader, Trash2, Edit2 } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/ui/modal';
import { Find, NewFind } from '../types/finds';
import { findService } from '@/services/findservice';

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

const FindsCatalog: React.FC = () => {
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

  const handleDelete: (find: Find) => Promise<void> = async (find: Find) => {
    if (!window.confirm('Are you sure you want to delete this find?')) return;
    setIsLoading(true);
    
    try {
      await findService.deleteFind(find.id, find.imageUrl);
      setFinds(prevFinds => prevFinds.filter(f => f.id !== find.id));
      setIsLoading(false);
    } catch (err) {
      setError("Failed to delete find. Please try again.");
      console.error('Error deleting find:', err);
    }
  };

  const handleShowForm: () => void = () => {
    setShowForm(!showForm);
    setEditingFind(null);
    setFormData(initialFind);
    setImagePreview("");
    setImageFile(null);
  };

  const handleEdit: (find: Find) => void = (find: Find) => {
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

  const handleCopyW3W: (words: string) => void = (words: string): void => {
    navigator.clipboard.writeText(words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const validateWhat3Words: (words: string) => boolean = (words: string): boolean => {
    const regex = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;
    return regex.test(words);
  };

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedInputChange = debounce((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, 300);

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

  const handleCancel: () => void = () => {
    setShowForm(false);
    setFormData(initialFind);
    setImagePreview("");
    setImageFile(null);
    setEditingFind(null);
  };

  const handleImageClick: (find: Find) => void = (find: Find) => {
    if (editingFind) {
      // Prevent image click during edit mode
      return;
    }
    setSelectedImage(find.imageUrl);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading your finds...</span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Metal Detecting Finds Catalog</h1>
        <button
          onClick={handleShowForm}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Plus size={20} />
          )}
          {editingFind ? 'Edit Find' : 'Add New Find'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingFind ? 'Edit Find' : 'Add New Find'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                name="name"
                className="w-full p-2 border rounded"
                value={formData.name}
                onChange={(e) => debouncedInputChange(e)}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Date Found</label>
              <input
                type="date"
                name="date"
                className="w-full p-2 border rounded"
                value={formData.date}
                onChange={(e) => debouncedInputChange(e)}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Location</label>
              <input
                type="text"
                name="location"
                className="w-full p-2 border rounded"
                value={formData.location}
                onChange={(e) => debouncedInputChange(e)}
              />
            </div>
            <div>
              <label className="block mb-2">what3words Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="what3words"
                  placeholder="word.word.word"
                  className="w-full p-2 border rounded"
                  value={formData.what3words}
                  onChange={(e) => debouncedInputChange(e)}
                />
                <a 
                  href={`https://what3words.com/${formData.what3words}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 p-2 rounded hover:bg-gray-200"
                >
                  <MapPin size={20} />
                </a>
              </div>
            </div>
            <div>
              <label className="block mb-2">Depth</label>
              <input
                type="text"
                name="depth"
                className="w-full p-2 border rounded"
                value={formData.depth}
                onChange={(e) => debouncedInputChange(e)}
              />
            </div>
            <div>
              <label className="block mb-2">Metal Type</label>
              <input
                type="text"
                name="metalType"
                className="w-full p-2 border rounded"
                value={formData.metalType}
                onChange={(e) => debouncedInputChange(e)}
              />
            </div>
            <div>
              <label className="block mb-2">Condition</label>
              <select
                name="condition"
                className="w-full p-2 border rounded"
                value={formData.condition}
                onChange={(e) => debouncedInputChange(e)}
              >
                <option value="">Select condition...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block mb-2">Notes</label>
              <textarea
                name="notes"
                className="w-full p-2 border rounded"
                value={formData.notes}
                onChange={(e) => debouncedInputChange(e)}
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-2">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div className="col-span-2 flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 ${
                  isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                } text-white px-4 py-2 rounded`}
              >
                {isSubmitting ? 'Saving...' : (editingFind ? 'Update Find' : 'Save Find')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finds.map((find) => (
          <div key={find.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative">
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button
                onClick={() => handleEdit(find)}
                className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50"
                title="Edit find"
              >
                <Edit2 className="text-blue-500" size={20} />
              </button>
              <button
                onClick={() => handleDelete(find)}
                className="p-2 bg-white rounded-full shadow-md hover:bg-red-50"
                title="Delete find"
              >
                <Trash2 className="text-red-500" size={20} />
              </button>
            </div>
            {/* Make image clickable */}
            <div 
              className="relative w-full h-48 cursor-pointer"
              onClick={() => handleImageClick(find)}
            >
              <Image
                src={find.imageUrl || '/placeholder.png'}
                alt={find.name}
                fill
                className="object-cover hover:opacity-90 transition-opacity"
                loading="eager"  // This will disable lazy loading
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.png';
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{find.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{find.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://what3words.com/${find.what3words}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {find.what3words}
                    </a>
                    <button
                      onClick={() => { handleCopyW3W(find.what3words); }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p><strong>Found:</strong> {find.date}</p>
                <p><strong>Depth:</strong> {find.depth}</p>
                <p><strong>Metal:</strong> {find.metalType}</p>
                <p><strong>Condition:</strong> {find.condition}</p>
                {find.notes && (
                  <p className="text-gray-600 text-sm mt-2">{find.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      >
        <div className="relative w-full h-[80vh]">
          <Image
            src={selectedImage || '/placeholder.png'}
            alt="Enlarged view"
            fill
            className="object-contain"
            loading="eager"  // This will disable lazy loading
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

export default FindsCatalog;