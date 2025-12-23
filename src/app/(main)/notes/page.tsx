'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NotesPage() {
  const { user, currentSpace } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_private: true });

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, currentSpace]);

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (currentSpace) {
        // Optionally filter by space if notes are space-specific
        // query = query.eq('space_id', currentSpace.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          space_id: currentSpace?.id || null,
          title: newNote.title,
          content: newNote.content,
          is_private: newNote.is_private,
        });

      if (error) throw error;

      toast.success('Note created');
      setIsCreating(false);
      setNewNote({ title: '', content: '', is_private: true });
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Add Note'}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>New Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={newNote.is_private}
                  onCheckedChange={(checked) => setNewNote({ ...newNote, is_private: checked })}
                />
                <Label htmlFor="private">Private Note</Label>
              </div>
              <Button type="submit">Save Note</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{note.title}</span>
                  {note.is_private && <span className="text-xs bg-gray-100 px-2 py-1 rounded">Private</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                <div className="text-xs text-muted-foreground mt-4">
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
