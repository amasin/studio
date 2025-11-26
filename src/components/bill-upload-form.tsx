'use client';

import { useState, useTransition, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { uploadBillAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Scan & Save'
      )}
    </Button>
  );
}

export function BillUploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload an image file.",
        })
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFormSubmit = (formData: FormData) => {
    if (!formData.get('billImage') || (formData.get('billImage') as File).size === 0) {
        toast({
            variant: "destructive",
            title: "No File Selected",
            description: "Please select a bill image to upload.",
        });
        return;
    }
    startTransition(async () => {
      const result = await uploadBillAction(formData);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <form ref={formRef} action={handleFormSubmit} className="space-y-6">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors',
          { 'p-4': preview }
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Bill preview"
              className="object-contain w-full h-full rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePreview();
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </>
        ) : (
          <div className="text-center">
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="mt-2 font-semibold text-primary">Click or drag & drop to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="billImage"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>
      <SubmitButton />
    </form>
  );
}
