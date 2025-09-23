"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// --- Mock Implementations for a Self-Contained Component ---

// Mock useRouter from next/navigation
const useRouter = () => ({
    push: (path: string) => console.log(`Navigating to ${path}`)
});

// Mock Clerk's useUser hook
const useUser = () => {
    return { 
        isLoaded: true,
        user: { publicMetadata: { role: 'admin' } } 
    };
};

// Mock Admin Context and Interfaces
export interface DomainData { 
  id: string; 
  name: string; 
  questionsCount: number; 
  activeUsers: number; 
  status: "active" | "inactive";
  createdAt: string; 
}

const useAdmin = () => {
    const [domains, setDomains] = useState<DomainData[]>([
        { id: "1", name: "Frontend Development", questionsCount: 2341, activeUsers: 3421, status: "active", createdAt: "2023-08-15" },
        { id: "2", name: "Backend Development", questionsCount: 1876, activeUsers: 2890, status: "active", createdAt: "2023-08-20" },
        { id: "3", name: "System Design", questionsCount: 945, activeUsers: 1654, status: "active", createdAt: "2023-09-01" },
        { id: "4", name: "Data Science", questionsCount: 1234, activeUsers: 1987, status: "inactive", createdAt: "2023-09-15" },
    ]);

    const addDomain = (domainData: { name: string }) => {
        const newDomain: DomainData = {
            id: Date.now().toString(),
            name: domainData.name,
            questionsCount: 0,
            activeUsers: 0,
            status: "active",
            createdAt: new Date().toISOString().split('T')[0]
        };
        setDomains(prev => [...prev, newDomain]);
    };

    const updateDomain = (domainId: string, updatedData: { name: string }) => {
        setDomains(prev => prev.map(d => d.id === domainId ? { ...d, ...updatedData } : d));
    };

    const deleteDomain = (domainId: string) => {
        setDomains(prev => prev.filter(d => d.id !== domainId));
    };

    const updateDomainStatus = (domainId: string, newStatus: "active" | "inactive") => {
        setDomains(prev => prev.map(d => d.id === domainId ? { ...d, status: newStatus } : d));
    };

    return { domains, addDomain, updateDomain, deleteDomain, updateDomainStatus };
};

// A simple mock toast function if you don't have one set up
const useToast = () => ({
  toast: (options: { title: string, description: string, variant?: string }) => {
    console.log(`Toast: ${options.title} - ${options.description}`);
  }
});


export default function ManageDomainsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { domains, addDomain, updateDomain, deleteDomain, updateDomainStatus } = useAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<DomainData | null>(null);
  const [domainName, setDomainName] = useState("");

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || user?.publicMetadata?.role !== 'admin') {
    return <div className="container py-8 text-center"><p>Loading or Access Denied...</p></div>;
  }
  
  const handleCreate = () => {
    if (!domainName.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    addDomain({ name: domainName });
    toast({ title: "Success", description: "Domain created successfully" });
    setIsCreateOpen(false);
    setDomainName("");
  };

  const openEditDialog = (domain: DomainData) => {
    setCurrentDomain(domain);
    setDomainName(domain.name);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!currentDomain || !domainName.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    updateDomain(currentDomain.id, { name: domainName });
    toast({ title: "Success", description: "Domain updated successfully" });
    setIsEditOpen(false);
    setCurrentDomain(null);
    setDomainName("");
  };
  
  const handleDelete = (domainId: string) => {
      deleteDomain(domainId);
      toast({ title: "Success", description: "Domain deleted successfully" });
  };

  const handleStatusToggle = (domain: DomainData) => {
      const newStatus = domain.status === 'active' ? 'inactive' : 'active';
      updateDomainStatus(domain.id, newStatus);
      toast({ title: "Status Updated", description: `${domain.name} is now ${newStatus}.`});
  }

  return (
    <div className="container py-8 space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Domains</h1>
          <p className="text-muted-foreground">Organize interview questions by subject areas</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="hero-button"><Plus className="h-4 w-4 mr-2" />Add Domain</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Domain</DialogTitle>
              <DialogDescription>Add a new subject area for interview questions.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="name">Domain Name</Label><Input id="name" value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="e.g., Mobile Development" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={() => setDomainName('')}>Cancel</Button></DialogClose>
              <Button onClick={handleCreate}>Create Domain</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Domains</CardTitle>
          <CardDescription>View and manage all available interview domains.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Active Users</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="font-medium">{domain.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`status-${domain.id}`}
                          checked={domain.status === 'active'}
                          onCheckedChange={() => handleStatusToggle(domain)}
                        />
                        {/* Added a fixed width to the label to prevent layout shift */}
                        <Label htmlFor={`status-${domain.id}`} className="capitalize w-16 text-left">
                            {domain.status}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>{domain.questionsCount.toLocaleString()}</TableCell>
                    <TableCell>{domain.activeUsers.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(domain)}>
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(domain.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain: {currentDomain?.name}</DialogTitle>
            <DialogDescription>Modify the domain details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="edit-name">Domain Name</Label><Input id="edit-name" value={domainName} onChange={(e) => setDomainName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" onClick={() => {setIsEditOpen(false); setDomainName('');}}>Cancel</Button></DialogClose>
            <Button onClick={handleUpdate}>Update Domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

