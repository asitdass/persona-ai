'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ProfileData {
  name: string;
  headline: string;
  about: string;
  skills: string;
  portfolioUrl: string;
  contactLinks: { email?: string; linkedin?: string; github?: string };
  socialLinks: { twitter?: string; website?: string };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    headline: '',
    about: '',
    skills: '',
    portfolioUrl: '',
    contactLinks: {},
    socialLinks: {},
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch('/api/profile');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setProfile({
          name: data.name || user.user_metadata?.name || '',
          headline: data.headline || '',
          about: data.about || '',
          skills: (data.skills || []).join(', '),
          portfolioUrl: data.portfolioUrl || '',
          contactLinks: data.contactLinks || {},
          socialLinks: data.socialLinks || {},
        });
      } else {
        setProfile((prev) => ({
          ...prev,
          name: user.user_metadata?.name || '',
        }));
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save profile');
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">This information helps your AI assistant represent you accurately.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
            Profile saved successfully!
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>How visitors will know you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g., Full-Stack Engineer | AI Enthusiast"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                placeholder="A brief description about yourself and your work..."
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="React, Node.js, PostgreSQL, AWS"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>Your online presence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio URL</Label>
              <Input
                id="portfolio"
                type="url"
                placeholder="https://yourportfolio.com"
                value={profile.portfolioUrl}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                value={profile.contactLinks.email || ''}
                onChange={(e) =>
                  setProfile({ ...profile, contactLinks: { ...profile.contactLinks, email: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/yourprofile"
                value={profile.contactLinks.linkedin || ''}
                onChange={(e) =>
                  setProfile({ ...profile, contactLinks: { ...profile.contactLinks, linkedin: e.target.value } })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                placeholder="https://github.com/yourusername"
                value={profile.contactLinks.github || ''}
                onChange={(e) =>
                  setProfile({ ...profile, contactLinks: { ...profile.contactLinks, github: e.target.value } })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}
