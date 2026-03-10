import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, UserPlus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserManagementProps {
    websites: any[];
}

export function UserManagement({ websites }: UserManagementProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("site_user");
    const [selectedSites, setSelectedSites] = useState<number[]>([]);

    const toggleSite = (siteId: number) => {
        setSelectedSites((prev) =>
            prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
        );
    };

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["/api/admin/users"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/users");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const createUserMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/admin/users", {
                email: email.trim(),
                password,
                role,
                sites: selectedSites
            });
            return response.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setEmail("");
            setPassword("");
            setRole("site_user");
            setSelectedSites([]);

            const createdEmail = data?.user?.email || data?.normalizedEmail;
            toast({
                title: "Succes",
                description: createdEmail
                    ? `Utilisateur cree avec succes : ${createdEmail}`
                    : "Utilisateur cree avec succes."
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: error.message || "Erreur lors de la creation",
                variant: "destructive"
            });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            return await apiRequest("DELETE", `/api/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Succes", description: "Utilisateur supprime" });
        },
        onError: (error: any) => {
            toast({ title: "Erreur", description: error.message || "Erreur de suppression", variant: "destructive" });
        }
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({ title: "Erreur", description: "Identifiant et mot de passe requis", variant: "destructive" });
            return;
        }

        if (role === "site_user" && selectedSites.length === 0) {
            toast({
                title: "Erreur",
                description: "Selectionnez au moins un site pour un utilisateur site_user.",
                variant: "destructive"
            });
            return;
        }

        createUserMutation.mutate();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Gestion des Utilisateurs (Superadmin)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Creer un nouvel utilisateur
                        </h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Identifiant (email ou pseudo)</Label>
                                    <Input
                                        placeholder="ex: admin ou jean.dupont@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Si vous n'ecrivez pas '@', '@webseo.local' est ajoute automatiquement.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mot de passe</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="site_user">Utilisateur (site specifique)</SelectItem>
                                        <SelectItem value="admin">Admin (tous les sites)</SelectItem>
                                        <SelectItem value="superadmin">Superadmin (controle total)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {role === "site_user" && (
                                <div className="space-y-2">
                                    <Label>Sites autorises</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {websites.map((site) => (
                                            <Badge
                                                key={site.id}
                                                variant={selectedSites.includes(site.id) ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => toggleSite(site.id)}
                                            >
                                                {site.name}
                                            </Badge>
                                        ))}
                                        {websites.length === 0 && <span className="text-sm text-muted-foreground">Aucun site disponible</span>}
                                    </div>
                                </div>
                            )}

                            <Button type="submit" disabled={createUserMutation.isPending}>
                                {createUserMutation.isPending ? "Creation..." : "Creer l'utilisateur"}
                            </Button>
                        </form>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-3 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Utilisateurs existants
                        </h3>
                        {isLoading ? (
                            <div className="text-sm text-gray-500">Chargement des utilisateurs...</div>
                        ) : (
                            <div className="space-y-2">
                                {users.map((u: any) => (
                                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground">
                                        <div>
                                            <div className="font-medium">{u.email}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <Badge variant={u.role === "superadmin" ? "destructive" : u.role === "admin" ? "default" : "secondary"}>
                                                    {u.role}
                                                </Badge>

                                                {u.role === "site_user" && u.sites && u.sites.length > 0 && (
                                                    <span>
                                                        {u.sites
                                                            .map((siteId: number) => {
                                                                const s = websites.find((w) => w.id === siteId);
                                                                return s ? s.name : `Site #${siteId}`;
                                                            })
                                                            .join(", ")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Etes-vous sur de vouloir supprimer "{u.email}" ?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteUserMutation.mutate(u.id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-sm text-muted-foreground">Aucun utilisateur trouve.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
