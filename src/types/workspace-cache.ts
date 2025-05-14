import { WorkspaceColor } from "./workspace-color";

export interface WorkspaceCache {
  edgeWorkspaceCacheVersion: number;
  workspaces: Workspace[];
}

export interface Workspace {
  accent: boolean;
  active: boolean;
  collaboratorsCount: number;
  color: WorkspaceColor;
  connectionUrl: string;
  count: number;
  edgeWorkspaceVersion: number;
  id: string;
  isOwner: boolean;
  isolated: boolean;
  menuSubtitle: string;
  name: string;
  shared: boolean;
  showDisconnectedUI: boolean;
  workspaceFluidStatus: number;
  last_active_time?: number;
  sharingUrl?: string;
}
