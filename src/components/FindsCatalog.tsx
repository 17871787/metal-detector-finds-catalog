'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Copy, Check, Plus, Loader, Trash2 } from 'lucide-react';
import Image from 'next/image';
// src/components/FindsCatalog.tsx
import { findService } from '../services/findservice';
import { Find, NewFind } from '../types/finds';

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
  const [newFind, setNewFind] = useState<NewFind>(initialFind);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadFinds();
  }, []);

  const loadFinds = async () => {
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

  const handleDelete = async (find: Find) => {
    if (!window.confirm('Are you sure you want to delete this find?')) return;
    
    try {
      await findService.deleteFind(find.id, find.imageUrl);
      setFinds(prevFinds => prevFinds.filter(f => f.id !== find.id));
    } catch (err) {
      setError("Failed to delete find. Please try again.");
      console.error('Error deleting find:', err);
    }
  };

  const handleShowForm = () => {
    setShowForm(!showForm);
  };

  const handleCopyW3W = (words: string): void => {
    navigator.clipboard.writeText(words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateWhat3Words = (words: string): boolean => {
    const regex = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;
    return regex.test(words);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (newFind.what3words && !validateWhat3Words(newFind.what3words)) {
        alert("Please enter a valid what3words address (format: word.word.word)");
        return;
      }
      
      const savedFind = await findService.addFind(newFind, imageFile || undefined);
      setFinds(prev => [savedFind, ...prev]);
      setShowForm(false);
      setNewFind(initialFind);
      setImagePreview("");
      setImageFile(null);
      setError("");
    } catch (err) {
      setError("Failed to save find. Please try again.");
      console.error('Error in handleSubmit:', err);
    } finally {
      setIsSubmitting(false);
    }
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
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={20} />
          Add New Find
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Find</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newFind.name}
                onChange={(e) => setNewFind({...newFind, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Date Found</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={newFind.date}
                onChange={(e) => setNewFind({...newFind, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Location</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newFind.location}
                onChange={(e) => setNewFind({...newFind, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">what3words Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="word.word.word"
                  className="w-full p-2 border rounded"
                  value={newFind.what3words}
                  onChange={(e) => setNewFind({...newFind, what3words: e.target.value.toLowerCase()})}
                />
                <a 
                  href={`https://what3words.com/${newFind.what3words}`}
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
                className="w-full p-2 border rounded"
                value={newFind.depth}
                onChange={(e) => setNewFind({...newFind, depth: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Metal Type</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newFind.metalType}
                onChange={(e) => setNewFind({...newFind, metalType: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Condition</label>
              <select
                className="w-full p-2 border rounded"
                value={newFind.condition}
                onChange={(e) => setNewFind({...newFind, condition: e.target.value})}
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
                className="w-full p-2 border rounded"
                value={newFind.notes}
                onChange={(e) => setNewFind({...newFind, notes: e.target.value})}
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
                  <Image
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
                onClick={() => setShowForm(false)}
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
                {isSubmitting ? 'Saving...' : 'Save Find'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finds.map((find) => (
          <div key={find.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow relative">
            <button
              onClick={() => handleDelete(find)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 z-10"
              title="Delete find"
            >
              <Trash2 className="text-red-500" size={20} />
            </button>
            <div className="relative w-full h-48">
              <Image
                src={find.imageUrl}
                alt={find.name}
                fill
                className="object-cover"
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
                      onClick={() => handleCopyW3W(find.what3words)}
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
    </div>
  );
};

export default FindsCatalog;0*6