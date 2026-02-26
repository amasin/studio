'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { storage, db } from '@/lib/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function BillUploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

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
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
        toast({
            variant: "destructive",
            title: "No File Selected",
            description: "Please select a bill image to upload.",
        });
        return;
    }

    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to upload a bill.",
        });
        return;
    }

    setIsUploading(true);
    const file = fileInputRef.current.files[0];
    const storageRef = ref(storage, `bills/${user.uid}/${Date.now()}_${file.name}`);

    try {
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      const docRef = await addDoc(collection(db, 'bills'), {
        userId: user.uid,
        imageUrl: downloadURL,
        status: 'processing',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Upload Successful",
        description: "Your bill is now being processed.",
      });

      router.push(`/bills/${docRef.id}`);

    } catch (error) {
        console.error("Error uploading bill: ", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Something went wrong. Please try again.",
        });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors',
          { 'p-4': preview }
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Bill preview"
              className="object-contain w-full h-full rounded-md"
            />
            {!isUploading && <Button
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
            </Button>}
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
          disabled={isUploading}
        />
      </div>
      <Button type="submit" disabled={isUploading || !preview} className="w-full">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Scan & Save'
        )}
      </Button>
    </form>
  );
}
