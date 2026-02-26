
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useAuth } from '@/firebase';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function BillUploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user || !db) return;

    setIsUploading(true);
    const billId = doc(collection(db, 'bills')).id;
    const storage = getStorage();
    const storageRef = ref(storage, `bills/${user.uid}/${billId}.jpg`);

    try {
      await setDoc(doc(db, 'bills', billId), {
        userId: user.uid,
        billImagePath: `bills/${user.uid}/${billId}.jpg`,
        status: 'pending_ocr',
        currency: 'INR',
        createdAt: serverTimestamp(),
      });

      await uploadBytes(storageRef, file);
      toast({ title: "Upload Successful", description: "Processing your receipt..." });
      router.push(`/bills/${billId}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors',
          { 'p-2': preview }
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="object-contain w-full h-full rounded-md" />
        ) : (
          <div className="text-center p-6 text-muted-foreground">
            <UploadCloud className="w-12 h-12 mx-auto" />
            <p className="mt-2 font-semibold">Click to upload receipt</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
      <Button type="submit" disabled={isUploading || !preview} className="w-full">
        {isUploading ? <Loader2 className="animate-spin mr-2" /> : "Scan & Find Savings"}
      </Button>
    </form>
  );
}
