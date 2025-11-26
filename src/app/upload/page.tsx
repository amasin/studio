import { BillUploadForm } from "@/components/bill-upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <div className="flex justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Upload a Bill</CardTitle>
          <CardDescription>
            Let's scan your bill to find savings. Upload a clear photo of your receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
