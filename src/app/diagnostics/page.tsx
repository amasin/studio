'use client';

import { useState } from 'react';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { pingHealthCheck } from '@/lib/functionsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function DiagnosticsPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [billCount, setBillCount] = useState<number | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePingHealth = async () => {
    setLoadingHealth(true);
    setError(null);
    try {
      const result = await pingHealthCheck();
      setHealthData(result);
    } catch (e: any) {
      setError(`Health Check Failed: ${e.message}`);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleCheckBills = async () => {
    if (!user) return;
    setLoadingBills(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'bills'),
        where('userId', '==', user.uid),
        limit(100)
      );
      const snap = await getDocs(q);
      setBillCount(snap.size);
    } catch (e: any) {
      setError(`Firestore Query Failed: ${e.message}`);
    } finally {
      setLoadingBills(false);
    }
  };

  const envInfo = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    region: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1',
    useEmulators: process.env.NEXT_PUBLIC_USE_EMULATORS === 'true',
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold font-headline">System Diagnostics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Variables loaded from .env.local</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project ID:</span>
              <span className="font-mono text-sm">{envInfo.projectId || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Functions Region:</span>
              <span className="font-mono text-sm">{envInfo.region}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Emulator Mode:</span>
              <Badge variant={envInfo.useEmulators ? "default" : "outline"}>
                {envInfo.useEmulators ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Current user session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">UID:</span>
              <span className="font-mono text-xs truncate max-w-[200px]">{user?.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-sm">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email Verified:</span>
              <Badge variant={user?.emailVerified ? "default" : "destructive"}>
                {user?.emailVerified ? 'YES' : 'NO'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Functions Test */}
        <Card>
          <CardHeader>
            <CardTitle>Backend (Cloud Functions)</CardTitle>
            <CardDescription>Test connection to healthCheck API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handlePingHealth} disabled={loadingHealth} className="w-full">
              {loadingHealth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Ping healthCheck
            </Button>
            {healthData && (
              <pre className="p-4 bg-muted rounded-md text-xs overflow-auto max-h-40">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Firestore Test */}
        <Card>
          <CardHeader>
            <CardTitle>Database (Firestore)</CardTitle>
            <CardDescription>Validate data access & security rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleCheckBills} disabled={loadingBills} variant="outline" className="w-full">
              {loadingBills ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Count My Bills
            </Button>
            {billCount !== null && (
              <div className="text-center p-6 border rounded-md">
                <span className="text-4xl font-bold text-primary">{billCount}</span>
                <p className="text-sm text-muted-foreground mt-2">Bills found for your UID</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(DiagnosticsPage);
