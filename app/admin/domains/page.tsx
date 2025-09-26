"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

// Domain interface matching the MongoDB model
export interface DomainData { 
  _id: string; 
  name: string; 
  questionsCount: number; // Total questions from both mock interviews and practice sessions
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}


export default function ManageDomainsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  // State management for domains
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<DomainData | null>(null);
  const [domainName, setDomainName] = useState("");

  // Fetch domains from API
  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/domains');
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({ title: "Error", description: "Unauthorized access", variant: "destructive" });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({ title: "Error", description: "Failed to load domains", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Create new domain
  const addDomain = async (domainData: { name: string }) => {
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domainData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create domain');
      }

      const newDomain = await response.json();
      setDomains(prev => [newDomain, ...prev]);
      toast({ title: "Success", description: "Domain created successfully" });
    } catch (error) {
      console.error('Error creating domain:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create domain", variant: "destructive" });
    }
  };

  // Update domain
  const updateDomain = async (domainId: string, updatedData: { name: string }) => {
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update domain');
      }

      const updatedDomain = await response.json();
      setDomains(prev => prev.map(d => d._id === domainId ? updatedDomain : d));
      toast({ title: "Success", description: "Domain updated successfully" });
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({ title: "Error", description: "Failed to update domain", variant: "destructive" });
    }
  };

  // Delete domain
  const deleteDomain = async (domainId: string) => {
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete domain');
      }

      setDomains(prev => prev.filter(d => d._id !== domainId));
      toast({ title: "Success", description: "Domain deleted successfully" });
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({ title: "Error", description: "Failed to delete domain", variant: "destructive" });
    }
  };

  // Update domain status
  const updateDomainStatus = async (domainId: string, newStatus: "active" | "inactive") => {
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update domain status');
      }

      const updatedDomain = await response.json();
      setDomains(prev => prev.map(d => d._id === domainId ? updatedDomain : d));
      toast({ title: "Status Updated", description: `Domain is now ${newStatus}.` });
    } catch (error) {
      console.error('Error updating domain status:', error);
      toast({ title: "Error", description: "Failed to update domain status", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (isLoaded && user?.publicMetadata?.role === 'admin') {
      fetchDomains();
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div className="container py-8 text-center"><p>Loading...</p></div>;
  }

  if (user?.publicMetadata?.role !== 'admin') {
    return <div className="container py-8 text-center"><p>Access Denied</p></div>;
  }
  
  const handleCreate = async () => {
    if (!domainName.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    
    await addDomain({ name: domainName });
    setIsCreateOpen(false);
    setDomainName("");
  };

  const openEditDialog = (domain: DomainData) => {
    setCurrentDomain(domain);
    setDomainName(domain.name);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!currentDomain || !domainName.trim()) {
        toast({ title: "Error", description: "Domain name is required", variant: "destructive" });
        return;
    }
    
    await updateDomain(currentDomain._id, { name: domainName });
    setIsEditOpen(false);
    setCurrentDomain(null);
    setDomainName("");
  };
  
  const handleDelete = async (domainId: string) => {
      await deleteDomain(domainId);
  };

  const handleStatusToggle = async (domain: DomainData) => {
      const newStatus = domain.status === 'active' ? 'inactive' : 'active';
      await updateDomainStatus(domain._id, newStatus);
  };

  return (
    <div className="w-full py-8 space-y-6 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Domains</h1>
          <p className="text-muted-foreground">Organize interview questions by subject areas for mock interviews and practice sessions</p>
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
          <CardDescription>View and manage all available interview domains with combined question counts from mock interviews and practice sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading domains...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Total Questions</span>
                        <div title="Includes questions from both mock interviews and practice sessions">
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain: DomainData) => (
                    <TableRow key={domain._id}>
                      <TableCell>
                        <div className="font-medium">{domain.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`status-${domain._id}`}
                            checked={domain.status === 'active'}
                            onCheckedChange={() => handleStatusToggle(domain)}
                          />
                          {/* Added a fixed width to the label to prevent layout shift */}
                          <Label htmlFor={`status-${domain._id}`} className="capitalize w-16 text-left">
                              {domain.status}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>{domain.questionsCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(domain)}>
                                      <Edit className="h-4 w-4 mr-2" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(domain._id)}>
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
          )}
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

