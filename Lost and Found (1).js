import React, { useState, useEffect } from 'react';
import { Search, Upload, Bell, Home, PlusCircle, X, Check, MessageCircle, MapPin, Calendar, Tag } from 'lucide-react';

const storage = {
  users: JSON.parse(localStorage.getItem('lf_users') || '{}'),
  items: JSON.parse(localStorage.getItem('lf_items') || '[]'),
  matches: JSON.parse(localStorage.getItem('lf_matches') || '[]'),
  
  saveUsers: function(users) {
    this.users = users;
    localStorage.setItem('lf_users', JSON.stringify(users));
  },
  
  saveItems: function(items) {
    this.items = items;
    localStorage.setItem('lf_items', JSON.stringify(items));
  },
  
  saveMatches: function(matches) {
    this.matches = matches;
    localStorage.setItem('lf_matches', JSON.stringify(matches));
  }
};

const aiMatch = (lostItem, foundItem) => {
  const lostText = `${lostItem.title} ${lostItem.description} ${lostItem.category}`.toLowerCase();
  const foundText = `${foundItem.title} ${foundItem.description} ${foundItem.category}`.toLowerCase();
  
  const lostWords = lostText.split(/\s+/);
  const foundWords = foundText.split(/\s+/);
  
  let matches = 0;
  lostWords.forEach(word => {
    if (word.length > 3 && foundWords.some(fw => fw.includes(word) || word.includes(fw))) {
      matches++;
    }
  });
  
  if (lostItem.category === foundItem.category) matches += 3;
  if (lostItem.location === foundItem.location) matches += 2;
  
  const score = Math.min(10, Math.round((matches / Math.max(lostWords.length, foundWords.length)) * 10 + Math.random() * 2));
  
  return score;
};

const LostFoundApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const categories = ['Electronics', 'Documents', 'Accessories', 'Books', 'Keys', 'Clothing', 'Others'];
  const locations = ['IT Block Floor 1', 'IT Block Floor 2', 'Library', 'Canteen', 'Main Block', 'Sports Complex', 'Parking'];

  useEffect(() => {
    setItems(storage.items);
    setMatches(storage.matches);
    
    // Load user from storage
    const savedUser = localStorage.getItem('lf_currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('home');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const userNotifications = matches.filter(m => 
        m.lostBy === currentUser.email || m.foundBy === currentUser.email
      );
      setNotifications(userNotifications);
    }
  }, [matches, currentUser]);

  // Google Sign-In Simulation
  const handleGoogleSignIn = () => {
    const mockUser = {
      email: `student${Math.floor(Math.random() * 1000)}@cit.edu`,
      name: `Student ${Math.floor(Math.random() * 100)}`,
      photo: `https://ui-avatars.com/api/?name=Student&background=random`
    };
    setCurrentUser(mockUser);
    localStorage.setItem('lf_currentUser', JSON.stringify(mockUser));
    storage.users[mockUser.email] = mockUser;
    storage.saveUsers(storage.users);
    setView('home');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('lf_currentUser');
    setView('login');
  };

  // Post Item
  const handlePostItem = (itemData) => {
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      postedBy: currentUser.email,
      postedAt: new Date().toISOString(),
      status: 'active'
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    storage.saveItems(updatedItems);
    
    // Auto-match with AI
    setTimeout(() => findMatches(newItem), 1000);
    
    setView('home');
  };

  // AI Matching Logic
  const findMatches = (newItem) => {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
    const potentialMatches = items.filter(item => 
      item.type === oppositeType && item.status === 'active'
    );
    
    potentialMatches.forEach(item => {
      const score = aiMatch(
        newItem.type === 'lost' ? newItem : item,
        newItem.type === 'found' ? newItem : item
      );
      
      if (score >= 6) {
        const match = {
          id: `${newItem.id}_${item.id}`,
          lostItemId: newItem.type === 'lost' ? newItem.id : item.id,
          foundItemId: newItem.type === 'found' ? newItem.id : item.id,
          lostBy: newItem.type === 'lost' ? newItem.postedBy : item.postedBy,
          foundBy: newItem.type === 'found' ? newItem.postedBy : item.postedBy,
          score,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        
        const updatedMatches = [...storage.matches, match];
        setMatches(updatedMatches);
        storage.saveMatches(updatedMatches);
      }
    });
  };

  // Filtered Items
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory && item.status === 'active';
  });

  // Get matches for an item
  const getItemMatches = (itemId) => {
    return matches.filter(m => 
      (m.lostItemId === itemId || m.foundItemId === itemId) && m.status === 'pending'
    );
  };

  // Login View
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">CIT Smart-Match</h1>
            <p className="text-gray-600">Your Campus AI Guardian</p>
          </div>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
          >
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">G</div>
            <span className="font-medium text-gray-700">Sign in with Google</span>
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Find lost items faster with AI-powered matching
          </p>
        </div>
      </div>
    );
  }

  // Post Item Form
  if (view === 'post') {
    return <PostItemForm onSubmit={handlePostItem} onCancel={() => setView('home')} categories={categories} locations={locations} />;
  }

  // Matches View
  if (view === 'matches') {
    return <MatchesView matches={notifications} items={items} currentUser={currentUser} onBack={() => setView('home')} />;
  }

  // Home View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">CIT Smart-Match</h1>
                <p className="text-xs text-gray-500">Lost & Found System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('matches')}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              <img
                src={currentUser.photo}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={handleSignOut}
                title="Click to sign out"
              />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search: blue wallet with SBI card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('lost')}
              className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                filterType === 'lost' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Lost
            </button>
            <button
              onClick={() => setFilterType('found')}
              className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                filterType === 'found' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Found
            </button>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-full text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              matches={getItemMatches(item.id)}
              currentUser={currentUser}
            />
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No items found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setView('post')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition"
      >
        <PlusCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

// Item Card Component
const ItemCard = ({ item, matches, currentUser }) => {
  const [showMatches, setShowMatches] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 flex-1">{item.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {item.type.toUpperCase()}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Tag className="w-3 h-3" />
            {item.category}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            {item.location}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(item.postedAt).toLocaleDateString()}
          </div>
        </div>
        
        {matches.length > 0 && (
          <button
            onClick={() => setShowMatches(!showMatches)}
            className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
          >
            🔍 {matches.length} Possible Match{matches.length > 1 ? 'es' : ''} Found
          </button>
        )}
        
        {showMatches && matches.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800 mb-2">AI-Detected Matches:</p>
            {matches.map(match => (
              <div key={match.id} className="text-xs text-yellow-700 mb-1">
                ⭐ Match Score: {match.score}/10 - Contact available
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Post Item Form Component
const PostItemForm = ({ onSubmit, onCancel, categories, locations }) => {
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: categories[0],
    location: locations[0],
    imageUrl: ''
  });

  const handleSubmit = () => {
    if (formData.title && formData.description) {
      onSubmit(formData);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate image upload - in real app, upload to Firebase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Post Item</h2>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'lost' })}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    formData.type === 'lost'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'found' })}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    formData.type === 'found'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Found Item
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Blue water bottle with stickers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details that will help identify the item..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg" />
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Post Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Matches View Component
const MatchesView = ({ matches, items, currentUser, onBack }) => {
  const getItemDetails = (itemId) => {
    return items.find(item => item.id === itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Your Matches</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No matches yet. Keep checking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => {
              const lostItem = getItemDetails(match.lostItemId);
              const foundItem = getItemDetails(match.foundItemId);
              
              return (
                <div key={match.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-600">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">🎯 Match Found!</h3>
                      <p className="text-sm text-gray-600">AI Confidence: {match.score}/10</p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3 bg-red-50">
                      <p className="text-xs font-medium text-red-700 mb-2">LOST ITEM</p>
                      <h4 className="font-semibold text-gray-800">{lostItem?.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{lostItem?.description}</p>
                    </div>

                    <div className="border rounded-lg p-3 bg-green-50">
                      <p className="text-xs font-medium text-green-700 mb-2">FOUND ITEM</p>
                      <h4 className="font-semibold text-gray-800">{foundItem?.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{foundItem?.description}</p>
                    </div>
                  </div>

                  <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Contact & Claim Item
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostFoundApp;