"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, BookOpen, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// --- Mock Implementations for a Self-Contained Component ---

// Mock useRouter from next/navigation
const useRouter = () => ({
    push: (path: string) => console.log(`Navigating to ${path}`)
});

// Mock Clerk's useUser hook
const useUser = () => {
    // To test the non-admin state, change the role to 'user'
    return { 
        isLoaded: true,
        user: { publicMetadata: { role: 'admin' } } 
    };
};

// Mock Admin Context and Interfaces
export interface DomainData { 
  id: string; 
  name: string; 
  description: string; 
  questionsCount: number; 
  activeUsers: number; 
  status: "active" | "draft" | "archived"; 
  createdAt: string; 
}

const useAdmin = () => {
    const [domains, setDomains] = useState<DomainData[]>([
        { id: "1", name: "Frontend Development", description: "React, Vue, Angular, JavaScript, CSS, HTML", questionsCount: 2341, activeUsers: 3421, status: "active", createdAt: "2023-08-15" },
        { id: "2", name: "Backend Development", description: "Node.js, Python, Java, APIs, Databases", questionsCount: 1876, activeUsers: 2890, status: "active", createdAt: "2023-08-20" },
        { id: "3", name: "System Design", description: "Scalability, Architecture, Distributed Systems", questionsCount: 945, activeUsers: 1654, status: "active", createdAt: "2023-09-01" },
        { id: "4", name: "Data Science", description: "Machine Learning, Statistics, Python, R", questionsCount: 1234, activeUsers: 1987, status: "draft", createdAt: "2023-09-15" },
    ]);

    const addDomain = (domainData: { name: string; description: string }) => {
        const newDomain: DomainData = {
            id: Date.now().toString(),
            ...domainData,
            questionsCount: 0,
            activeUsers: 0,
            status: "draft",
            createdAt: new Date().toISOString().split('T')[0]
        };
        setDomains(prev => [...prev, newDomain]);
    };

    const updateDomain = (domainId: string, updatedData: { name: string; description: string }) => {
        setDomains(prev => prev.map(d => d.id === domainId ? { ...d, ...updatedData } : d));
    };

    const deleteDomain = (domainId: string) => {
        setDomains(prev => prev.filter(d => d.id !== domainId));
    };

    return { domains, addDomain, updateDomain, deleteDomain };
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
  const { domains, addDomain, updateDomain, deleteDomain } = useAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<DomainData | null>(null);
  const [domainDetails, setDomainDetails] = useState({ name: "", description: "" });

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || user?.publicMetadata?.role !== 'admin') {
    return <div className="container py-8 text-center"><p>Loading or Access Denied...</p></div>;
  }
  
  const handleCreate = () => {
    if (!domainDetails.name.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    addDomain(domainDetails);
    toast({ title: "Success", description: "Domain created successfully" });
    setIsCreateOpen(false);
    setDomainDetails({ name: "", description: "" });
  };

  const openEditDialog = (domain: DomainData) => {
    setCurrentDomain(domain);
    setDomainDetails({ name: domain.name, description: domain.description });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!currentDomain || !domainDetails.name.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    updateDomain(currentDomain.id, domainDetails);
    toast({ title: "Success", description: "Domain updated successfully" });
    setIsEditOpen(false);
    setCurrentDomain(null);
    setDomainDetails({ name: "", description: "" });
  };
  
  const handleDelete = (domainId: string) => {
      // In a real app, you'd want a confirmation dialog here.
      deleteDomain(domainId);
      toast({ title: "Success", description: "Domain deleted successfully" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/80 hover:bg-green-500/90">Active</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "archived": return <Badge variant="outline">Archived</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <div className="space-y-2"><Label htmlFor="name">Domain Name</Label><Input id="name" value={domainDetails.name} onChange={(e) => setDomainDetails({...domainDetails, name: e.target.value})} placeholder="e.g., Mobile Development" /></div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={domainDetails.description} onChange={(e) => setDomainDetails({...domainDetails, description: e.target.value})} placeholder="Topics covered..." /></div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
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
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="font-medium">{domain.name}</div>
                      <div className="text-sm text-muted-foreground">{domain.description}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell>{domain.questionsCount.toLocaleString()}</TableCell>
                    <TableCell>{domain.activeUsers.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(domain)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(domain.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
              <div className="space-y-2"><Label htmlFor="edit-name">Domain Name</Label><Input id="edit-name" value={domainDetails.name} onChange={(e) => setDomainDetails({...domainDetails, name: e.target.value})} /></div>
              <div className="space-y-2"><Label htmlFor="edit-desc">Description</Label><Textarea id="edit-desc" value={domainDetails.description} onChange={(e) => setDomainDetails({...domainDetails, description: e.target.value})} /></div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleUpdate}>Update Domain</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

