import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import websocketClient from "@/lib/websocketClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList,
  Users,
  MessageSquare,
  PencilLine,
  CheckCircle,
  Clock,
  XCircle,
  Refresh,
  AlertCircle,
  Plus,
  Filter,
  Eye,
  Trash2,
  Edit,
 } from '@mui/icons-material';

// Import mock data and types
import {
  ReviewRequest,
  Comment,
  Annotation,
  RevisionHistory,
  getReviewRequests,
  getCommentsByObject,
  getAnnotationsByObject,
  getRevisionHistoryByObject,
  updateReviewRequestStatus,
} from "@/lib/mockReviewerData";

type User = {
  id: number;
  username: string;
  fullName: string;
};

const ReviewRequestItem = ({
  request,
  onViewDetails,
  onUpdateStatus,
}: {
  request: ReviewRequest;
  onViewDetails: (request: ReviewRequest) => void;
  onUpdateStatus: (id: number, status: string) => void;
}) => {
  let statusColor = "";
  let statusIcon = null;

  switch (request.status) {
    case "pending":
      statusColor = "bg-yellow-100 text-yellow-800";
      statusIcon = <Clock className="w-4 h-4" />;
      break;
    case "in_progress":
      statusColor = "bg-blue-100 text-blue-800";
      statusIcon = <Refresh className="w-4 h-4" />;
      break;
    case "completed":
      statusColor = "bg-green-100 text-green-800";
      statusIcon = <CheckCircle className="w-4 h-4" />;
      break;
    case "rejected":
      statusColor = "bg-red-100 text-red-800";
      statusIcon = <XCircle className="w-4 h-4" />;
      break;
  }

  let priorityColor = "";
  switch (request.priority) {
    case "low":
      priorityColor = "bg-slate-100 text-slate-800";
      break;
    case "medium":
      priorityColor = "bg-amber-100 text-amber-800";
      break;
    case "high":
      priorityColor = "bg-red-100 text-red-800";
      break;
  }

  return (
    <Card className="mb-4 border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">
              {request.objectType} Review #{request.id}
            </CardTitle>
            <CardDescription
</>>
              Object ID: {request.objectId} • Requested:{" "}
              {new Date(request.requestedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex gap-2"><>

            <Badge className={priorityColor}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </Badge>
            <Badge
</> className={statusColor + " flex items-center gap-1"}>
              {statusIcon}
              {request.status.replace("_", " ").charAt(0).toUpperCase() +
                request.status.replace("_", " ").slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-2">
          {request.notes || "No additional notes provided"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="secondary" size="sm" onClick={() => onViewDetails(request)}><>

          <Eye className="w-4 h-4 mr-1" /> View Details
        </Button>
        <div
</> className="flex gap-2">
          {request.status === "pending" && (
            <Button size="sm" onClick={() => onUpdateStatus(request.id, "in_progress")}>
              Start Review
            </Button>
          )}
          {request.status === "in_progress" && (
            <Button size="sm" onClick={() => onUpdateStatus(request.id, "completed")}>
              Complete Review
            </Button>
          )}
          {(request.status === "pending" || request.status === "in_progress") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onUpdateStatus(request.id, "rejected")}
            >
              Reject
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const CommentItem = ({
  comment,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  onEdit: (comment: Comment) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <Card className="mb-3 border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle className="text-sm font-medium">User #{comment.userId}</CardTitle>
          <CardDescription
</> className="text-xs">
            {new Date(comment.createdAt).toLocaleString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{comment.content}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(comment)}><>

          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button
</>
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={() => onDelete(comment.id)}
        >
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

const AnnotationItem = ({
  annotation,
  onEdit,
  onDelete,
}: {
  annotation: Annotation;
  onEdit: (annotation: Annotation) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <Card className="mb-3 border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle className="text-sm font-medium">{annotation.annotationType}</CardTitle>
          <CardDescription
</> className="text-xs">
            {new Date(annotation.createdAt).toLocaleString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent><>

        <p className="text-xs text-muted-foreground mb-1">Position: {annotation.position}</p>
        <p
</> className="text-sm">{annotation.content}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(annotation)}><>

          <Edit className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button
</>
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={() => onDelete(annotation.id)}
        >
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

const RevisionHistoryItem = ({ revision }: { revision: RevisionHistory }) => {
  return (
    <Card className="mb-3 border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle className="text-sm font-medium">{revision.revisionType}</CardTitle>
          <CardDescription
</> className="text-xs">
            {new Date(revision.createdAt).toLocaleString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{revision.revisionContent}</p>
        {revision.previousVersionId && (
          <p className="text-xs text-muted-foreground mt-1">
            Previous Version: #{revision.previousVersionId}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default function ReviewerPage() {
  const [activeTab, setActiveTab] = useState("review-requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [objectTypeFilter, setObjectTypeFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Connect to WebSocket and set up listeners
  useEffect(() => {
    // Don't attempt to connect if fallback mode is already active
    if (!fallbackActive) {
      // Connect to the WebSocket server
      websocketClient.connect();
    }

    // Listen for connection state changes
    const unsubscribeConnectionState = websocketClient.onConnectionStateChange((connected) => {
      console.log(
        `[ReviewerPage] WebSocket connection state: ${connected ? "connected" : "disconnected"}`
      );
      setIsWebSocketConnected(connected);

      if (connected) {
        // Connection successful, disable fallback mode
        setFallbackActive(false);
        toast({
          title: "Real-time updates enabled",
          description: "You will receive instant notifications for review changes",
          variant: "default",
        });
      } else if (!fallbackActive) {
        // Only show toast for initial disconnection, not when already in fallback mode
        toast({
          title: "Real-time updates disabled",
          description: "Connection to update server lost. Retrying...",
          variant: "destructive",
        });

        // If we've received a maximum reconnection attempts notification,
        // activate fallback mode
        if (
          websocketClient.getReconnectAttempts() >=
          websocketClient.getMaxReconnectAttempts() - 5
        ) {
          console.log(
            "[ReviewerPage] Maximum reconnection attempts nearly reached, activating fallback mode"
          );
          setFallbackActive(true);
        }
      }
    });

    // Subscribe to new review request notifications
    const unsubscribeNewRequest = websocketClient.subscribe("new_review_request", (data) => {
      console.log("[ReviewerPage] New review request received:", data);
      // Add the new review request to the cache or refetch
      queryClient.invalidateQueries({ queryKey: ["/api/reviewer/review-requests"] });

      toast({
        title: "New Review Request",
        description: `A new ${data.objectType} review request has been created`,
      });
    });

    // Subscribe to updated review request notifications
    const unsubscribeUpdatedRequest = websocketClient.subscribe(
      "updated_review_request",
      (data) => {
        console.log("[ReviewerPage] Updated review request received:", data);
        // Update the cached review request
        queryClient.invalidateQueries({ queryKey: ["/api/reviewer/review-requests"] });

        toast({
          title: "Review Request Updated",
          description: `Review request #${data.id} has been updated`,
        });
      }
    );

    // Subscribe to new comment notifications
    const unsubscribeNewComment = websocketClient.subscribe("new_comment", (data) => {
      console.log("[ReviewerPage] New comment received:", data);
      // If the comment is for the currently selected request, update the UI
      if (
        selectedRequest &&
        data.objectType === selectedRequest.objectType &&
        data.objectId === selectedRequest.objectId
      ) {
        queryClient.invalidateQueries({
          queryKey: [
            "/api/reviewer/comments",
            selectedRequest.objectType,
            selectedRequest.objectId,
          ],
        });

        toast({
          title: "New Comment",
          description: "A new comment has been added to this request",
        });
      }
    });

    // Subscribe to new annotation notifications
    const unsubscribeNewAnnotation = websocketClient.subscribe("new_annotation", (data) => {
      console.log("[ReviewerPage] New annotation received:", data);
      // If the annotation is for the currently selected request, update the UI
      if (
        selectedRequest &&
        data.objectType === selectedRequest.objectType &&
        data.objectId === selectedRequest.objectId
      ) {
        queryClient.invalidateQueries({
          queryKey: [
            "/api/reviewer/annotations",
            selectedRequest.objectType,
            selectedRequest.objectId,
          ],
        });

        toast({
          title: "New Annotation",
          description: "A new annotation has been added to this request",
        });
      }
    });

    // Subscribe to new revision history notifications
    const unsubscribeNewRevision = websocketClient.subscribe("new_revision", (data) => {
      console.log("[ReviewerPage] New revision received:", data);
      // If the revision is for the currently selected request, update the UI
      if (
        selectedRequest &&
        data.objectType === selectedRequest.objectType &&
        data.objectId === selectedRequest.objectId
      ) {
        queryClient.invalidateQueries({
          queryKey: [
            "/api/reviewer/revision-history",
            selectedRequest.objectType,
            selectedRequest.objectId,
          ],
        });

        toast({
          title: "Document Updated",
          description: `A new revision has been saved: ${data.revisionType}`,
        });
      }
    });

    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeConnectionState();
      unsubscribeNewRequest();
      unsubscribeUpdatedRequest();
      unsubscribeNewComment();
      unsubscribeNewAnnotation();
      unsubscribeNewRevision();
      websocketClient.disconnect();
    };
  }, [queryClient, selectedRequest, toast, fallbackActive]);

  // Fetch review requests
  const {
    data: reviewRequests,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
    error: requestsError,
  } = useQuery({
    queryKey: ["/api/reviewer/review-requests"],
    // Using proper API request with a fallback to mock data
    queryFn: async () => {
      try {
        // Try the real API endpoint first
        return await apiRequest("/api/reviewer/review-requests");
      } catch (error) {
        console.log("Falling back to mock data for review requests");
        // Fall back to mock data if the API fails
        return getReviewRequests();
      }
    },
    select: (data) => data as ReviewRequest[],
  });

  // Fetch comments for selected request
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/reviewer/comments", selectedRequest?.objectType, selectedRequest?.objectId],
    queryFn: async () => {
      if (!selectedRequest) return [];

      try {
        // Try the real API endpoint first
        return await apiRequest(
          `/api/reviewer/comments?objectType=${selectedRequest.objectType}&objectId=${selectedRequest.objectId}`
        );
      } catch (error) {
        console.log("Falling back to mock data for comments");
        // Fall back to mock data if the API fails
        return getCommentsByObject(selectedRequest.objectType, selectedRequest.objectId);
      }
    },
    select: (data) => data as Comment[],
    enabled: !!selectedRequest,
  });

  // Fetch annotations for selected request
  const { data: annotations, isLoading: isLoadingAnnotations } = useQuery({
    queryKey: ["/api/reviewer/annotations", selectedRequest?.objectType, selectedRequest?.objectId],
    queryFn: async () => {
      if (!selectedRequest) return [];

      try {
        // Try the real API endpoint first
        return await apiRequest(
          `/api/reviewer/annotations?objectType=${selectedRequest.objectType}&objectId=${selectedRequest.objectId}`
        );
      } catch (error) {
        console.log("Falling back to mock data for annotations");
        // Fall back to mock data if the API fails
        return getAnnotationsByObject(selectedRequest.objectType, selectedRequest.objectId);
      }
    },
    select: (data) => data as Annotation[],
    enabled: !!selectedRequest,
  });

  // Fetch revision history for selected request
  const { data: revisionHistory, isLoading: isLoadingRevisions } = useQuery({
    queryKey: [
      "/api/reviewer/revision-history",
      selectedRequest?.objectType,
      selectedRequest?.objectId,
    ],
    queryFn: async () => {
      if (!selectedRequest) return [];

      try {
        // Try the real API endpoint first
        return await apiRequest(
          `/api/reviewer/revision-history?objectType=${selectedRequest.objectType}&objectId=${selectedRequest.objectId}`
        );
      } catch (error) {
        console.log("Falling back to mock data for revision history");
        // Fall back to mock data if the API fails
        return getRevisionHistoryByObject(selectedRequest.objectType, selectedRequest.objectId);
      }
    },
    select: (data) => data as RevisionHistory[],
    enabled: !!selectedRequest,
  });

  // Update review request status mutation
  const updateReviewStatus = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      try {
        // Try the real API endpoint first
        return await apiRequest(`/api/reviewer/review-requests/${data.id}`, {
          method: "PUT",
          data: { status: data.status },
        });
      } catch (error) {
        console.log("Falling back to mock data for updating review status");
        // Fall back to mock data if the API fails
        return updateReviewRequestStatus(data.id, data.status);
      }
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Review request status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviewer/review-requests"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update review request status",
        variant: "destructive",
      });
      console.error("Failed to update review request status:", error);
    },
  });

  const handleViewDetails = (request: ReviewRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateReviewStatus.mutate({ id, status });
  };

  const handleEditComment = (comment: Comment) => {
    // Implement edit comment functionality
    console.log("Edit comment:", comment);
  };

  const handleDeleteComment = (id: number) => {
    // Implement delete comment functionality
    console.log("Delete comment:", id);
  };

  const handleEditAnnotation = (annotation: Annotation) => {
    // Implement edit annotation functionality
    console.log("Edit annotation:", annotation);
  };

  const handleDeleteAnnotation = (id: number) => {
    // Implement delete annotation functionality
    console.log("Delete annotation:", id);
  };

  // Filter review requests based on selected filters
  const filteredRequests = reviewRequests?.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = objectTypeFilter === "all" || request.objectType === objectTypeFilter;
    return matchesStatus && matchesType;
  });

  // Extract unique object types for filter dropdown
  const objectTypes = reviewRequests ? [...new Set(reviewRequests.map((r) => r.objectType))] : [];

  if (isRequestsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0"><>

              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div
</> className="ml-3"><>

              <h3 className="text-sm font-medium text-red-800">Error loading reviewer data</h3>
              <div
</> className="mt-2 text-sm text-red-700">
                <p>{requestsError instanceof Error ? requestsError.message : "Unknown error"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6"><>

        <h1 className="text-3xl font-bold tracking-tight">Reviewer Dashboard</h1>
        <div
</> className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm"><>

              <div
                className={`w-2 h-2 rounded-full mr-2 ${isWebSocketConnected ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span
</> className="text-muted-foreground">
                {isWebSocketConnected
                  ? "Real-time updates enabled"
                  : fallbackActive
                    ? "Using poll-based updates"
                    : "Connecting..."}
              </span>
            </div>
            {!isWebSocketConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFallbackActive(false);
                  websocketClient.disconnect();
                  websocketClient.connect();
                }}
              >
                <Refresh className="w-3 h-3 mr-1" />
                Retry Connection
              </Button>
            )}
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Review Request
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="review-requests"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="review-requests" className="flex items-center"><>

            <ClipboardList className="w-4 h-4 mr-2" /> Review Requests
          </TabsTrigger>
          <TabsTrigger
</> value="assigned-to-me" className="flex items-center"><>

            <Users className="w-4 h-4 mr-2" /> Assigned to Me
          </TabsTrigger>
          <TabsTrigger
</> value="comments" className="flex items-center"><>

            <MessageSquare className="w-4 h-4 mr-2" /> Comments
          </TabsTrigger>
          <TabsTrigger
</> value="annotations" className="flex items-center">
            <PencilLine className="w-4 h-4 mr-2" /> Annotations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review-requests">
          {/* Filters for review requests */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium mr-2">Filter by:</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><>

                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem
</> value="pending">Pending</SelectItem><>

                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem
</> value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={objectTypeFilter} onValueChange={setObjectTypeFilter}>
                <SelectTrigger className="w-[150px]"><>

                  <SelectValue placeholder="Object Type" />
                </SelectTrigger>
                <SelectContent
</>>
                  <SelectItem value="all">All Types</SelectItem>
                  {objectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Review requests list */}
          {isLoadingRequests ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-[200px]" /><>

                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                  <Skeleton
</> className="h-4 w-[70%] mt-2" />
                  <Skeleton className="h-4 w-[50%] mt-2" />
                  <div className="flex justify-between mt-4">
                    <Skeleton className="h-9 w-[100px]" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-[80px]" />
                      <Skeleton className="h-9 w-[80px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <ReviewRequestItem
                    key={request.id}
                    request={request}
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              ) : (
                <div className="text-center p-10 border rounded-lg">
                  <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" /><>

                  <h3 className="mt-2 font-medium">No review requests found</h3>
                  <p
</> className="text-sm text-muted-foreground mt-1">
                    {reviewRequests?.length
                      ? "Try changing your filters to see more results"
                      : "Create your first review request to get started"}
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="assigned-to-me">
          <div className="text-center p-10 border rounded-lg">
            <Users className="h-10 w-10 mx-auto text-muted-foreground" /><>

            <h3 className="mt-2 font-medium">Assigned review requests</h3>
            <p
</> className="text-sm text-muted-foreground mt-1">
              View and manage review requests assigned to you
            </p>
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="text-center p-10 border rounded-lg">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" /><>

            <h3 className="mt-2 font-medium">Comments</h3>
            <p
</> className="text-sm text-muted-foreground mt-1">
              View and manage all comments across objects
            </p>
          </div>
        </TabsContent>

        <TabsContent value="annotations">
          <div className="text-center p-10 border rounded-lg">
            <PencilLine className="h-10 w-10 mx-auto text-muted-foreground" /><>

            <h3 className="mt-2 font-medium">Annotations</h3>
            <p
</> className="text-sm text-muted-foreground mt-1">
              View and manage all annotations across objects
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><>

            <DialogTitle className="text-xl">
              {selectedRequest?.objectType} Review #{selectedRequest?.id}
            </DialogTitle>
            <DialogDescription
</>>View and manage details for this review request</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><>

                  <h4 className="text-sm font-medium text-muted-foreground">Object Information</h4>
                  <p
</> className="text-sm mt-1">Type: {selectedRequest.objectType}</p>
                  <p className="text-sm mt-1">ID: {selectedRequest.objectId}</p>
                </div>
                <div><>

                  <h4 className="text-sm font-medium text-muted-foreground">Request Information</h4>
                  <p
</> className="text-sm mt-1">Status: {selectedRequest.status.replace("_", " ")}</p><>

                  <p className="text-sm mt-1">Priority: {selectedRequest.priority}</p>
                  <p
</> className="text-sm mt-1">
                    Requested: {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                  {selectedRequest.completedAt && (
                    <p className="text-sm mt-1">
                      Completed: {new Date(selectedRequest.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4"><>

                <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                <p
</> className="text-sm mt-1 p-2 border rounded-md">
                  {selectedRequest.notes || "No additional notes provided"}
                </p>
              </div>

              <Separator className="my-4" />

              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="comments" className="flex items-center"><>

                    <MessageSquare className="w-4 h-4 mr-2" /> Comments
                  </TabsTrigger>
                  <TabsTrigger
</> value="annotations" className="flex items-center"><>

                    <PencilLine className="w-4 h-4 mr-2" /> Annotations
                  </TabsTrigger>
                  <TabsTrigger
</> value="history" className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> Revision History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="comments">
                  <div className="flex justify-between mb-4"><>

                    <h3 className="text-lg font-medium">Comments</h3>
                    <Button
</> size="sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Comment
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px]">
                    {isLoadingComments ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-[100px]" /><>

                              <Skeleton className="h-4 w-[80px]" />
                            </div>
                            <Skeleton
</> className="h-12 w-full mt-2" />
                            <div className="flex justify-end gap-2 mt-2">
                              <Skeleton className="h-8 w-[60px]" />
                              <Skeleton className="h-8 w-[60px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {comments && comments.length > 0 ? (
                          comments.map((comment) => (
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              onEdit={handleEditComment}
                              onDelete={handleDeleteComment}
                            />
                          ))
                        ) : (
                          <div className="text-center p-6">
                            <p className="text-sm text-muted-foreground">No comments yet</p>
                          </div>
                        )}
                      </>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="annotations">
                  <div className="flex justify-between mb-4"><>

                    <h3 className="text-lg font-medium">Annotations</h3>
                    <Button
</> size="sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Annotation
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px]">
                    {isLoadingAnnotations ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-[100px]" /><>

                              <Skeleton className="h-4 w-[80px]" />
                            </div>
                            <Skeleton
</> className="h-4 w-[150px] mt-1" />
                            <Skeleton className="h-10 w-full mt-2" />
                            <div className="flex justify-end gap-2 mt-2">
                              <Skeleton className="h-8 w-[60px]" />
                              <Skeleton className="h-8 w-[60px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {annotations && annotations.length > 0 ? (
                          annotations.map((annotation) => (
                            <AnnotationItem
                              key={annotation.id}
                              annotation={annotation}
                              onEdit={handleEditAnnotation}
                              onDelete={handleDeleteAnnotation}
                            />
                          ))
                        ) : (
                          <div className="text-center p-6">
                            <p className="text-sm text-muted-foreground">No annotations yet</p>
                          </div>
                        )}
                      </>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">Revision History</h3>
                  </div>

                  <ScrollArea className="h-[300px]">
                    {isLoadingRevisions ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-[100px]" /><>

                              <Skeleton className="h-4 w-[80px]" />
                            </div>
                            <Skeleton
</> className="h-10 w-full mt-2" />
                            <Skeleton className="h-4 w-[120px] mt-1" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {revisionHistory && revisionHistory.length > 0 ? (
                          revisionHistory.map((revision) => (
                            <RevisionHistoryItem key={revision.id} revision={revision} />
                          ))
                        ) : (
                          <div className="text-center p-6">
                            <p className="text-sm text-muted-foreground">No revision history yet</p>
                          </div>
                        )}
                      </>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedRequest && selectedRequest.status === "in_progress" && (
              <Button onClick={() => handleUpdateStatus(selectedRequest.id, "completed")}>
                Complete Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
