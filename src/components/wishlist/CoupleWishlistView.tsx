import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Gift,
  MapPinned,
  Palette,
  Plane,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Wine,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WishlistCategory, WishlistItem } from '../../types';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Select,
  Textarea,
} from '../common/UIPrimitives';

export const CoupleWishlistView: React.FC = () => {
  const { wishlistItems, addWishlistItem, toggleWishlistItemCompleted, deleteWishlistItem, user } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WishlistCategory>('gifts');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priority, setPriority] = useState<WishlistItem['priority']>('high');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [shared, setShared] = useState(true);

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All items', icon: <Sparkles /> },
    { id: 'gifts', label: 'Gifts & keepsakes', icon: <Gift /> },
    { id: 'restaurants', label: 'Restaurants & dining', icon: <Wine /> },
    { id: 'activities', label: 'Dates & activities', icon: <Palette /> },
    { id: 'trips', label: 'Travel & trips', icon: <Plane /> },
    { id: 'places', label: 'Places to visit', icon: <MapPinned /> },
    { id: 'future_goals', label: 'Future bucket list', icon: <Star /> },
  ];

  const filteredItems = wishlistItems.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addWishlistItem({
      title,
      category,
      estimatedPrice,
      priority,
      url,
      description,
      addedBy: user?.name || 'You',
      shared,
      completed: false,
    });

    setTitle('');
    setDescription('');
    setUrl('');
    setEstimatedPrice('');
    setModalOpen(false);
  };

  const getPriorityBadge = (p: WishlistItem['priority']) => {
    switch (p) {
      case 'dream':
        return <Badge variant="purple">Dream goal</Badge>;
      case 'high':
        return <Badge variant="rose">High priority</Badge>;
      case 'medium':
        return <Badge variant="amber">Someday soon</Badge>;
      default:
        return <Badge variant="zinc">Casual</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<Gift />}
        title="Our wishlist"
        subtitle="Save gifts, restaurants to try, activities and travel bucket-list items in one shared place."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add item
          </Button>
        }
      />

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip key={c.id} selected={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} icon={c.icon}>
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Wishlist Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-6 h-6" />}
          title="Your wishlist is empty"
          description="Add gifts you would love, restaurants to try, or activities you want to experience together."
          actionLabel="Add item"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                item.completed
                  ? 'bg-zinc-50/70 border-zinc-200/60 opacity-80'
                  : 'bg-white border-zinc-200 shadow-2xs hover:border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleWishlistItemCompleted(item.id)}
                    className="mt-0.5 text-zinc-400 hover:text-emerald-600 transition-colors shrink-0"
                    aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300 hover:text-zinc-500" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm text-zinc-900 ${item.completed ? 'line-through text-zinc-400' : ''}`}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {getPriorityBadge(item.priority)}
                  {item.estimatedPrice && (
                    <span className="text-xs font-bold text-zinc-800">{item.estimatedPrice}</span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span>Saved by {item.addedBy}</span>
                <div className="flex items-center gap-1.5">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium text-xs flex items-center gap-1"
                    >
                      <span>View link</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteWishlistItem(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-500" /> Add to wishlist
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div>
                <FieldLabel>Item or experience</FieldLabel>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Polaroid Go Instant Camera or Bastian Sunset Dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option value="gifts">Gifts & keepsakes</option>
                    <option value="restaurants">Restaurants & dining</option>
                    <option value="activities">Dates & activities</option>
                    <option value="trips">Travel & trips</option>
                    <option value="places">Places to visit</option>
                    <option value="future_goals">Future bucket list</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                    <option value="dream">Dream goal</option>
                    <option value="high">High priority</option>
                    <option value="medium">Someday soon</option>
                    <option value="low">Casual</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Estimated price</FieldLabel>
                  <Input
                    type="text"
                    placeholder="e.g. ₹4,500"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Product or maps URL</FieldLabel>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Why we want this</FieldLabel>
                <Textarea
                  rows={2}
                  placeholder="e.g. For our scrapbook memories or weekend date"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 accent-rose-600"
                />
                Share with partner
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
