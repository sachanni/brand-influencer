import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Download, 
  ExternalLink, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  FileText,
  Eye
} from "lucide-react";

interface ContentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description: string;
    contentType: string;
    contentUrl: string;
    previewUrl?: string;
    platform: string;
    submittedAt: string;
    campaignTitle: string;
    influencerName: string;
  };
}

export function ContentViewerModal({ isOpen, onClose, content }: ContentViewerModalProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-black text-white';
      case 'youtube': return 'bg-red-100 text-red-800';
      case 'facebook': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVideoPlay = () => {
    const video = document.getElementById('content-video') as HTMLVideoElement;
    if (video) {
      if (videoPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setVideoPlaying(!videoPlaying);
    }
  };

  const handleVideoMute = () => {
    const video = document.getElementById('content-video') as HTMLVideoElement;
    if (video) {
      video.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  const renderContent = () => {
    const contentType = content.contentType.toLowerCase();

    if (contentType === 'video') {
      return (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            id="content-video"
            className="w-full h-auto max-h-[70vh] object-contain"
            controls
            controlsList="nodownload"
            preload="metadata"
            poster={content.previewUrl}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onVolumeChange={(e) => setVideoMuted((e.target as HTMLVideoElement).muted)}
            onError={() => {
              console.warn('Video failed to load:', content.contentUrl);
            }}
            playsInline
            data-testid="video-player"
          >
            <source src={content.contentUrl} type="video/mp4" />
            <source src={content.contentUrl} type="video/webm" />
            <source src={content.contentUrl} type="video/mov" />
            Your browser does not support the video tag.
            <p>If the video doesn't load, <a href={content.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">click here to view externally</a>.</p>
          </video>
          
          {/* Platform badge overlay */}
          <div className="absolute top-4 right-4">
            <Badge className={getPlatformColor(content.platform)}>
              {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
            </Badge>
          </div>
        </div>
      );
    }

    if (contentType === 'pdf' || contentType === 'document') {
      return (
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
          {/* PDF Viewer with Google Drive viewer for better compatibility */}
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(content.contentUrl)}&embedded=true`}
            className="w-full h-full border-0"
            title={`PDF: ${content.title}`}
            data-testid="pdf-viewer"
            onError={() => {
              // If Google viewer fails, try direct PDF link
              const iframe = document.querySelector('[data-testid="pdf-viewer"]') as HTMLIFrameElement;
              if (iframe) {
                iframe.src = content.contentUrl;
              }
            }}
          />
          
          {/* Platform badge overlay */}
          <div className="absolute top-4 right-4">
            <Badge className={getPlatformColor(content.platform)}>
              {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
            </Badge>
          </div>
        </div>
      );
    }

    if (contentType === 'image') {
      return (
        <div className="text-center">
          <img
            src={content.contentUrl || content.previewUrl}
            alt={content.title}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            data-testid="image-viewer"
          />
        </div>
      );
    }

    // Fallback for other content types
    return (
      <div className="p-6 text-center bg-gray-50 border rounded-lg">
        <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Content Preview</h3>
        <p className="text-gray-600 mb-4">This content type is not directly previewable</p>
        <Button 
          asChild 
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="button-view-content-external"
        >
          <a href={content.contentUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Content
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="content-viewer-modal">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-xl font-bold mb-2">{content.title}</DialogTitle>
              <DialogDescription className="text-gray-600 mb-3">
                {content.description}
              </DialogDescription>
              
              {/* Content metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {content.contentType}
                  </Badge>
                  <Badge className={getPlatformColor(content.platform)}>
                    {content.platform}
                  </Badge>
                </div>
                <div>Campaign: <span className="font-medium">{content.campaignTitle}</span></div>
                <div>By: <span className="font-medium">{content.influencerName}</span></div>
                <div>Submitted: <span className="font-medium">{formatDate(content.submittedAt)}</span></div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                data-testid="button-download-content"
              >
                <a href={content.contentUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                data-testid="button-open-external"
              >
                <a href={content.contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open External
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content display area */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}