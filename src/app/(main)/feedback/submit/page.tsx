'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackType } from '@/types';
import { toast } from '@/components/Toast';
import { motion } from 'framer-motion';
import { SendIcon, AlertCircle } from 'lucide-react';
import { LoadingButton } from '@/components/LoadingButton';

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors above');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to submit feedback');
        return;
      }

      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          type,
          title,
          description,
          status: 'pending',
          priority: 'normal'
        });

      if (insertError) throw insertError;

      toast.success('Feedback submitted!', { emoji: '📨', subtitle: 'Thank you for helping us improve!' });
      setTimeout(() => router.push('/feedback'), 500);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Share Your Feedback</h1>
          <p className="text-muted-foreground">Help us improve the hostel management experience</p>
        </div>

        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <CardTitle>Submit Feedback</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-wider">Feedback Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'feature' as FeedbackType, icon: '💡', label: 'Feature Request', desc: 'Suggest something new' },
                    { value: 'issue' as FeedbackType, icon: '🐛', label: 'Report Issue', desc: 'Report a problem' }
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setType(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        type === option.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Title</label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors({ ...errors, title: undefined });
                    }}
                    placeholder="Briefly describe your feedback..."
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      errors.title ? 'border-red-500 bg-red-50/50' : 'border-border focus:border-primary'
                    }`}
                    maxLength={100}
                  />
                  <div className="absolute right-3 top-3 text-xs font-medium text-muted-foreground">
                    {title.length}/100
                  </div>
                </div>
                {errors.title && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </motion.p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Description</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors({ ...errors, description: undefined });
                    }}
                    placeholder="Provide more details about your feedback..."
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${
                      errors.description ? 'border-red-500 bg-red-50/50' : 'border-border focus:border-primary'
                    }`}
                    maxLength={2000}
                  />
                  <div className="absolute right-3 bottom-3 text-xs font-medium text-muted-foreground">
                    {description.length}/2000
                  </div>
                </div>
                {errors.description && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.div className="flex gap-3 pt-4" whileHover={{ scale: 1.01 }}>
                <LoadingButton
                  type="submit"
                  size="lg"
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  loading={loading}
                  loadingText="Submitting..."
                >
                  <SendIcon className="h-4 w-4" />
                  Submit Feedback
                </LoadingButton>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'feature' ? 'e.g., Add dark mode' : 'e.g., Login button not working'}
              required
              maxLength={255}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'feature'
                  ? 'Describe the feature you would like to see...'
                  : 'Describe the issue you encountered...'
              }
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title || !description}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
