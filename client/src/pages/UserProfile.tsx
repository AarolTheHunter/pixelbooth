import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Settings, Camera, Heart, Users } from 'lucide-react';
import { SafeUserProfile } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  userId?: string; // If not provided, will show current user's profile
}

export default function UserProfile({ userId }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<SafeUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileId = userId || currentUser?.id;

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    fetchUserProfile();
  }, [profileId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${profileId}/profile`, {
        credentials: 'include',
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{error || 'Profile not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Header */}
        <Card data-testid="card-profile-header">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24" data-testid="avatar-profile">
                <AvatarImage src={profile.profilePicture || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName ? profile.displayName[0].toUpperCase() : profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-display-name">
                      {profile.displayName || profile.username}
                    </h1>
                    <p className="text-muted-foreground" data-testid="text-username">@{profile.username}</p>
                  </div>
                  
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      data-testid="button-edit-profile"
                      onClick={() => window.location.href = '/profile/settings'}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-muted-foreground" data-testid="text-bio">
                    {profile.bio}
                  </p>
                )}

                {/* Profile Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-photos-count">
                      {profile.photosCount} photos
                    </span>
                  </div>
                  
                  {profile.followersCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-followers-count">
                        {profile.followersCount} followers
                      </span>
                    </div>
                  )}
                  
                  {profile.followingCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-following-count">
                        {profile.followingCount} following
                      </span>
                    </div>
                  )}
                </div>

                {/* Privacy Badge */}
                <div>
                  <Badge variant={profile.isPublic ? "default" : "secondary"} data-testid="badge-privacy">
                    {profile.isPublic ? "Public Profile" : "Private Profile"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Photos */}
        <Card data-testid="card-recent-photos">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Recent Photos
            </CardTitle>
            <CardDescription>
              {isOwnProfile ? 'Your latest photos' : `Latest photos from ${profile.displayName || profile.username}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.photosCount > 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Photo gallery will be implemented in the next phase</p>
                <Button variant="outline" className="mt-4" data-testid="button-view-gallery">
                  View All Photos
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {isOwnProfile ? 'You haven\'t taken any photos yet' : 'No photos yet'}
                </p>
                {isOwnProfile && (
                  <Button data-testid="button-take-photo" onClick={() => window.location.href = '/camera'}>
                    Take Your First Photo
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Date */}
        <Card data-testid="card-profile-info">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Unknown'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}