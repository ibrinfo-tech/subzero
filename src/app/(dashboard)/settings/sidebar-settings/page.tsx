'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { GripVertical, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  order: number;
}

export default function SidebarSettingsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/sidebar-menu-order', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load menu items');
      }

      const data = await response.json();
      if (data.success) {
        setMenuItems(data.menuItems || []);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
      toast.error('Failed to load sidebar menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...menuItems];
    const draggedItem = newItems[draggedIndex];
    
    // Remove dragged item
    newItems.splice(draggedIndex, 1);
    
    // Insert at new position
    newItems.splice(dropIndex, 0, draggedItem);
    
    // Update order values
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setMenuItems(updatedItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/sidebar-menu-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ menuItems }),
      });

      if (!response.ok) {
        throw new Error('Failed to save menu order');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Sidebar menu order saved successfully');
        // Reload to get updated data
        await loadMenuItems();
      }
    } catch (error) {
      console.error('Failed to save menu order:', error);
      toast.error('Failed to save sidebar menu order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/sidebar-menu-order', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset menu order');
      }

      toast.success('Menu order reset to default');
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to reset menu order:', error);
      toast.error('Failed to reset menu order');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sidebar Settings</h1>
        <p className="text-sm text-muted-foreground">
          Reorder sidebar navigation menus by dragging and dropping items.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Navigation Menu Order</CardTitle>
              <CardDescription>
                Drag and drop items to reorder them in the sidebar navigation
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving || isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isLoading || menuItems.length === 0}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted/30 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No menu items available
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border bg-card
                    cursor-move transition-all
                    ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                    ${dragOverIndex === index && draggedIndex !== index ? 'border-primary bg-primary/5 scale-105' : 'border-border'}
                    hover:border-primary/50 hover:bg-accent/50
                  `}
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.path}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Order: {item.order}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

