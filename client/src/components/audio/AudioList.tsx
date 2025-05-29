import { toast } from "sonner";
import type { Audio } from "@/types/index";
import { useAudioStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Headphones, Trash2, Download, Loader2, FileAudio } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/format";
import { useState } from "react";

interface AudioListProps {
  audioList: Audio[];
}

export default function AudioList({ audioList }: AudioListProps) {
  const { deleteAudio, isLoading } = useAudioStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteAudio = async (audioId: string) => {
    setDeletingId(audioId);
    try {
      await deleteAudio(audioId);
      toast.success("Audio summary deleted successfully");
    } catch (error) {
      toast.error("Failed to delete audio summary");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadAudio = (audio: Audio, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = audio.fileUrl;
      link.download = `${audio.title || "audio-summary"}.${
        audio.format || "mp3"
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download audio");
    }
  };

  if (audioList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileAudio className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No audio summaries</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Upload your first document to generate an audio summary and it will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-6">
        {audioList.map((audio) => (
          <Card key={audio.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium line-clamp-2 leading-tight">
                      {audio.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(
                          audio.createdAt || new Date().toISOString()
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(audio.fileSize)}
                      </Badge>
                      {audio.format && (
                        <Badge variant="outline" className="text-xs uppercase">
                          {audio.format}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <AudioPlayer src={audio.fileUrl} title={audio.title} />
            </CardContent>

            <CardFooter className="flex justify-between pt-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={isLoading || deletingId === audio.id}
                  >
                    {deletingId === audio.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Audio Summary</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{audio.title}"? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteAudio(audio.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => handleDownloadAudio(audio, e)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download audio file</p>
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
