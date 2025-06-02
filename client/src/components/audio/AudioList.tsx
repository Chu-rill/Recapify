import { toast } from 'sonner';
import { Audio } from '@/types';
import { useAudioStore } from '@/lib/store';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/ui/audio-player';
import { 
  Headphones,
  Trash2, 
  Download, 
  Loader2 
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/format';

interface AudioListProps {
  audioList: Audio[];
}

export default function AudioList({ audioList }: AudioListProps) {
  const { deleteAudio, isLoading } = useAudioStore();
  
  const handleDeleteAudio = async (audioId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this audio summary? This action cannot be undone.')) {
      try {
        await deleteAudio(audioId);
        toast.success('Audio summary deleted successfully');
      } catch (error) {
        toast.error('Failed to delete audio summary');
      }
    }
  };
  
  const handleDownloadAudio = (audio: Audio, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = audio.fileUrl;
    link.download = `${audio.title || 'audio-summary'}.${audio.format || 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (audioList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No audio summaries found</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {audioList.map((audio) => (
        <Card key={audio.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium line-clamp-1">
                    {audio.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(audio.createdAt || new Date().toISOString())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(audio.fileSize)}
                    </p>
                    {audio.format && (
                      <p className="text-xs text-muted-foreground uppercase">
                        {audio.format}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <AudioPlayer src={audio.fileUrl} title={audio.title} />
          </CardContent>
          
          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex gap-1"
              disabled={isLoading}
              onClick={(e) => handleDeleteAudio(audio.id, e)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only md:not-sr-only md:inline-block">
                Delete
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex gap-1"
              onClick={(e) => handleDownloadAudio(audio, e)}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:inline-block">
                Download
              </span>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}