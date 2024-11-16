'use client';

import React, { useState } from 'react';
import { MapPin, Copy, Check, Plus } from 'lucide-react';

// Define the shape of a find
interface Find {
  id: number;
  name: string;
  date: string;
  location: string;
  coordinates: string;
  what3words: string;
  depth: string;
  metalType: string;
  condition: string;
  notes: string;
  imageUrl: string;
}

// Type for new finds (before they have an id and imageUrl)
type NewFind = Omit<Find, 'id' | 'imageUrl'>;

// Initial state for the new find form
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
  const [finds, setFinds] = useState<Find[]>([
    {
      id: 1,
      name: "1942 Silver Quarter",
      date: "2024-03-15",
      location: "Thompson Park",
      coordinates: "40.7128° N, 74.0060° W",
      what3words: "filled.count.soap",
      depth: "6 inches",
      metalType: "Silver",
      condition: "Good",
      notes: "Found near old playground area",
      imageUrl: "/api/placeholder/300/200"
    }
  ]);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [newFind, setNewFind] = useState<NewFind>(initialFind);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCopyW3W = (words: string): void => {
    navigator.clipboard.writeText(words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateWhat3Words = (words: string): boolean => {
    const regex = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;
    return regex.test(words);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (newFind.what3words && !validateWhat3Words(newFind.what3words)) {
        alert("Please enter a valid what3words address (format: word.word.word)");
        return;
      }
      
      // Use setTimeout to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 0));
      
      setFinds(prevFinds => [...prevFinds, { 
        ...newFind, 
        id: prevFinds.length + 1, 
        imageUrl: "/api/placeholder/300/200" 
      }]);
      
      setShowForm(false);
      setNewFind(initialFind);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Metal Detecting Finds Catalog</h1>
        <button
          onClick={() => setShowForm(!showForm)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewFind({...newFind, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Date Found</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={newFind.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewFind({...newFind, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Location</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newFind.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewFind({...newFind, location: e.target.value})}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setNewFind({...newFind, what3words: e.target.value.toLowerCase()})}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewFind({...newFind, depth: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Metal Type</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={newFind.metalType}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewFind({...newFind, metalType: e.target.value})}
              />
            </div>
            <div>
              <label className="block mb-2">Condition</label>
              <select
                className="w-full p-2 border rounded"
                value={newFind.condition}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setNewFind({...newFind, condition: e.target.value})}
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setNewFind({...newFind, notes: e.target.value})}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`col-span-2 ${
                isSubmitting 
                  ? 'bg-gray-400' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white px-4 py-2 rounded transition-colors`}
            >
              {isSubmitting ? 'Saving...' : 'Save Find'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finds.map((find) => (
          <div key={find.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <img
              src={find.imageUrl}
              alt={find.name}
              className="w-full h-48 object-cover"
            />
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

export default FindsCatalog;
