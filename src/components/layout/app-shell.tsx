'use client';

import Link from 'next/link';
import {
  Home,
  FileText,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import Header from '../header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '../icons/logo';
import { useUser } from '@/firebase';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  if (pathname === '/login') return <>{children}</>;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <Logo className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold font-headline">BillBuddy</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Dashboard"
              >
                <Link href="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/bills')}
                tooltip="Bills"
              >
                <Link href="/bills">
                  <FileText />
                  <span>Bills</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/upload'}
                tooltip="Upload"
              >
                <Link href="/upload">
                  <Upload />
                  <span>Upload Bill</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt={user?.displayName || 'User'} />
              <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm overflow-hidden">
              <span className="font-semibold truncate">{user?.displayName || 'User'}</span>
              <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
