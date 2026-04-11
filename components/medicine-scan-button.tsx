'use client';

import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useImageScan } from '@/lib/use-image-scan';

interface MedicineScanButtonProps {
  /** Called when OCR succeeds — sets the parent's searchQuery */
  onNameDetected: (name: string) => void;
}

/**
 * Non-intrusive scan button.
 * Renders as a compact icon button — designed to sit INSIDE the existing
 * Input wrapper so it doesn't alter layout or spacing.
 */
export function MedicineScanButton({ onNameDetected }: MedicineScanButtonProps) {
  const { scanState, error, fileInputRef, openPicker, handleFileChange } =
    useImageScan(onNameDetected);

  const isProcessing = scanState === 'processing';
  const isSuccess   = scanState === 'success';
  const isError     = scanState === 'error';

  return (
    <>
      {/* Hidden file input — lives outside the DOM flow */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            // Keep the same h-11 height as the sibling Input to avoid reflowing
            className="h-11 w-11 shrink-0 rounded-xl relative hover:bg-muted"
            title="Scan medicine label"
            aria-label="Scan medicine label from image"
          >
            {isProcessing && (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            {isSuccess && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {isError && (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            {scanState === 'idle' && (
              <Camera className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-xl border-border/50 backdrop-blur-md">
          <DropdownMenuItem 
            onSelect={() => openPicker('camera')}
            className="rounded-lg cursor-pointer flex items-center gap-2 p-3 hover:bg-primary/10 transition-colors"
          >
            <Camera className="w-4 h-4 text-primary" />
            <span className="font-medium">Take photo</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => openPicker('gallery')}
            className="rounded-lg cursor-pointer flex items-center gap-2 p-3 hover:bg-primary/10 transition-colors"
          >
            <Upload className="w-4 h-4 text-primary" />
            <span className="font-medium">Upload image</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
