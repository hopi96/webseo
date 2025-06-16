import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddWebsiteDialog } from "./add-website-dialog";
import type { Website } from "@shared/schema";

interface WebsiteSelectorProps {
  selectedWebsiteId?: number;
  onWebsiteChange: (websiteId: number) => void;
}

export function WebsiteSelector({ selectedWebsiteId, onWebsiteChange }: WebsiteSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: websites, isLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  if (isLoading) {
    return (
      <div className="px-4 py-3 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-3 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Select
              value={selectedWebsiteId?.toString()}
              onValueChange={(value) => onWebsiteChange(parseInt(value))}
            >
              <SelectTrigger className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a website" />
              </SelectTrigger>
              <SelectContent>
                {websites?.map((website) => (
                  <SelectItem key={website.id} value={website.id.toString()}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="ml-3 p-3 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AddWebsiteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </>
  );
}
