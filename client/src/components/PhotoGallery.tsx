import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Share2, Download, Trash2, Eye, Heart, MessageCircle, Bookmark, 
  Search, Filter, TrendingUp, Users, Send, MoreHorizontal, UserCircle 
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { PhotoWithDetails, PhotoCommentWithUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  isPublicGallery?: boolean;
  userId?: string;
  showUserPhotos?: boolean;
}

export default function PhotoGallery({ isPublicGallery = false, userId, showUserPhotos = false }: PhotoGalleryProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDetails | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newComment, setNewComment] = useState("");

  // Query to fetch photos based on type
  const { data: photosData, isLoading, error } = useQuery({
    queryKey: isPublicGallery 
      ? ['/api/photos/public'] 
      : showUserPhotos && userId 
        ? ['/api/users', userId, 'photos']
        : ['/api/photos/public'],
    enabled: true
  });

  const photos = (photosData as any)?.photos || [];

  // Query to fetch comments for selected photo
  const { data: commentsData } = useQuery({
    queryKey: ['/api/photos', selectedPhoto?.id, 'comments'],
    enabled: !!selectedPhoto?.id
  });

  const comments = (commentsData as any)?.comments || [];

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ photoId, isLiked }: { photoId: string; isLiked: boolean }) => {
      if (isLiked) {
        return apiRequest('DELETE', `/api/photos/${photoId}/like`);
      } else {
        return apiRequest('POST', `/api/photos/${photoId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos/public'] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'photos'] });
      }
    }
  });

  // Favorite/Unfavorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ photoId, isFavorited }: { photoId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        return apiRequest('DELETE', `/api/photos/${photoId}/favorite`);
      } else {
        return apiRequest('POST', `/api/photos/${photoId}/favorite`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos/public'] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'photos'] });
      }
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ photoId, comment }: { photoId: string; comment: string }) => {
      return apiRequest('POST', `/api/photos/${photoId}/comments`, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', selectedPhoto?.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/photos/public'] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'photos'] });
      }
      setNewComment("");
      toast({ title: "Comment added successfully!" });
    }
  });

  // Set as Profile Picture mutation
  const setProfilePictureMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return apiRequest('PUT', '/api/users/profile', { profilePicture: imageData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ 
        title: "Profile picture updated!",
        description: "Your profile picture has been set successfully."
      });
      setSelectedPhoto(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update profile picture",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = (photo: PhotoWithDetails) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to like photos", variant: "destructive" });
      return;
    }
    likeMutation.mutate({ photoId: photo.id, isLiked: !!photo.isLikedByCurrentUser });
  };

  const handleFavorite = (photo: PhotoWithDetails) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to favorite photos", variant: "destructive" });
      return;
    }
    favoriteMutation.mutate({ photoId: photo.id, isFavorited: !!photo.isFavoritedByCurrentUser });
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to comment", variant: "destructive" });
      return;
    }
    if (!selectedPhoto || !newComment.trim()) return;
    
    commentMutation.mutate({ photoId: selectedPhoto.id, comment: newComment.trim() });
  };

  const handleDownload = (photo: PhotoWithDetails) => {
    const link = document.createElement('a');
    link.href = photo.imageData;
    link.download = `prettyclick-${photo.id}.png`;
    link.click();
    toast({ title: "Photo downloaded!" });
  };

  const handleShare = (photo: PhotoWithDetails) => {
    if (photo.shareCode) {
      const shareUrl = `${window.location.origin}/shared/${photo.shareCode}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share link copied to clipboard!" });
    }
  };

  const handleSetAsProfilePicture = (photo: PhotoWithDetails) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to set profile picture", variant: "destructive" });
      return;
    }
    if (photo.userId !== user?.id) {
      toast({ title: "You can only set your own photos as profile picture", variant: "destructive" });
      return;
    }
    setProfilePictureMutation.mutate(photo.imageData);
  };

  const filteredPhotos = photos.filter((photo: PhotoWithDetails) =>
    searchQuery === "" || 
    photo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
        <div className="max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-destructive/10 rounded-lg p-8">
            <h2 className="text-xl font-bold mb-2 text-destructive">Error Loading Photos</h2>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-muted/50 rounded-lg p-12">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
            <p className="text-muted-foreground mb-6">
              {isPublicGallery ? "No public photos have been shared yet." : "Start taking some amazing photos!"}
            </p>
            {!isPublicGallery && (
              <Button className="bg-primary hover:bg-primary/90 hover-elevate" data-testid="button-start-camera">
                Start Taking Photos
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-1/20 to-chart-2/20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="heading-gallery">
                {isPublicGallery ? "Public Gallery" : showUserPhotos ? "User Photos" : "My Photos"}
              </h1>
              <p className="text-muted-foreground">{filteredPhotos.length} photos</p>
            </div>
            
            {/* Gallery Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" data-testid="button-trending">
                <TrendingUp className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-users">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search photos, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.map((photo: PhotoWithDetails) => (
            <Card 
              key={photo.id}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover-elevate cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
              onMouseEnter={() => setHoveredPhoto(photo.id)}
              onMouseLeave={() => setHoveredPhoto(null)}
              data-testid={`card-photo-${photo.id}`}
            >
              {/* Photo Image */}
              <div className="aspect-square relative">
                <img
                  src={photo.imageData}
                  alt={photo.title || "Photo"}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with actions */}
                {hoveredPhoto === photo.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(photo);
                      }}
                      className={photo.isLikedByCurrentUser ? "text-red-500" : ""}
                      data-testid={`button-like-${photo.id}`}
                    >
                      <Heart className={`h-4 w-4 ${photo.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(photo);
                      }}
                      className={photo.isFavoritedByCurrentUser ? "text-yellow-500" : ""}
                      data-testid={`button-favorite-${photo.id}`}
                    >
                      <Bookmark className={`h-4 w-4 ${photo.isFavoritedByCurrentUser ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(photo);
                      }}
                      data-testid={`button-share-${photo.id}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Photo Info */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={photo.user.profilePicture || ""} />
                    <AvatarFallback className="text-xs">
                      {photo.user.displayName?.[0] || photo.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium" data-testid={`text-username-${photo.id}`}>
                    {photo.user.displayName || photo.user.username}
                  </span>
                </div>

                {/* Photo Title & Description */}
                {photo.title && (
                  <h3 className="font-semibold text-sm mb-1 truncate" data-testid={`text-title-${photo.id}`}>
                    {photo.title}
                  </h3>
                )}
                {photo.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2" data-testid={`text-description-${photo.id}`}>
                    {photo.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" data-testid={`text-likes-${photo.id}`}>
                      <Heart className="h-3 w-3" />
                      {photo.likesCount}
                    </span>
                    <span className="flex items-center gap-1" data-testid={`text-comments-${photo.id}`}>
                      <MessageCircle className="h-3 w-3" />
                      {photo.commentsCount}
                    </span>
                  </div>
                  <span data-testid={`text-date-${photo.id}`}>
                    {formatDate(photo.createdAt?.toString() || null)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-photo-detail">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedPhoto.user.profilePicture || ""} />
                    <AvatarFallback>
                      {selectedPhoto.user.displayName?.[0] || selectedPhoto.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold" data-testid="text-modal-username">
                      {selectedPhoto.user.displayName || selectedPhoto.user.username}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-modal-date">
                      {formatDate(selectedPhoto.createdAt?.toString() || null)}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Photo */}
                <div className="space-y-4">
                  <img
                    src={selectedPhoto.imageData}
                    alt={selectedPhoto.title || "Photo"}
                    className="w-full rounded-lg"
                    data-testid="img-modal-photo"
                  />
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(selectedPhoto)}
                      className={selectedPhoto.isLikedByCurrentUser ? "text-red-500" : ""}
                      data-testid="button-modal-like"
                    >
                      <Heart className={`h-4 w-4 mr-2 ${selectedPhoto.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                      {selectedPhoto.likesCount}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFavorite(selectedPhoto)}
                      className={selectedPhoto.isFavoritedByCurrentUser ? "text-yellow-500" : ""}
                      data-testid="button-modal-favorite"
                    >
                      <Bookmark className={`h-4 w-4 mr-2 ${selectedPhoto.isFavoritedByCurrentUser ? 'fill-current' : ''}`} />
                      Favorite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedPhoto)}
                      data-testid="button-modal-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(selectedPhoto)}
                      data-testid="button-modal-share"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    {selectedPhoto.userId === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetAsProfilePicture(selectedPhoto)}
                        disabled={setProfilePictureMutation.isPending}
                        data-testid="button-modal-set-profile-picture"
                      >
                        {setProfilePictureMutation.isPending ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Setting...
                          </>
                        ) : (
                          <>
                            <UserCircle className="h-4 w-4 mr-2" />
                            Set as Profile
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  {/* Photo Title & Description */}
                  {selectedPhoto.title && (
                    <h3 className="text-lg font-semibold" data-testid="text-modal-title">
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-muted-foreground" data-testid="text-modal-description">
                      {selectedPhoto.description}
                    </p>
                  )}

                  {/* Comments */}
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold">Comments ({comments.length})</h4>
                    {comments.map((comment: PhotoCommentWithUser) => (
                      <div key={comment.id} className="flex gap-2" data-testid={`comment-${comment.id}`}>
                        <Avatar className="h-6 w-6 mt-1">
                          <AvatarImage src={comment.user.profilePicture || ""} />
                          <AvatarFallback className="text-xs">
                            {comment.user.displayName?.[0] || comment.user.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {comment.user.displayName || comment.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt?.toString() || null)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  {isAuthenticated && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 min-h-[80px]"
                        data-testid="textarea-comment"
                      />
                      <Button
                        onClick={handleComment}
                        disabled={!newComment.trim() || commentMutation.isPending}
                        data-testid="button-add-comment"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}