import { ActionPanel, Action, Icon, List, closeMainWindow } from "@raycast/api";
import { readFileSync, existsSync } from "fs";
import { Workspace, WorkspaceCache } from "./types/workspace-cache";
import { useState } from "react";
import { useCachedPromise } from "@raycast/utils";
import { promisifyExec } from "./utils/promisifyExec";
import { getWorkspaceCacheFilePath, getEdgePath, discoverEdgeProfiles } from "./utils/edgePaths";
import { hexMap, WorkspaceColor } from "./types/workspace-color";
import { alphabetical } from "radash";
import { EdgeProfile } from "./types/edge-profile";

const readWorkspaceCacheFile = (profilePath: string): Workspace[] => {
  const workspaceCacheFilePath = getWorkspaceCacheFilePath(profilePath);

  if (!existsSync(workspaceCacheFilePath)) {
    return [];
  }

  try {
    const res = readFileSync(workspaceCacheFilePath, "utf-8").toString();
    const json = JSON.parse(res) as WorkspaceCache;

    // Add profile information to each workspace
    return json.workspaces.map((workspace) => ({
      ...workspace,
      profilePath,
      profileName: profilePath === "Default" ? "Default" : profilePath,
    }));
  } catch (error) {
    console.error(`Error reading workspace cache for profile ${profilePath}:`, error);
    return [];
  }
};

const readAllWorkspaceCacheFiles = (): Workspace[] => {
  const profiles = discoverEdgeProfiles();
  const allWorkspaces: Workspace[] = [];

  for (const profile of profiles) {
    if (profile.hasWorkspaces) {
      const workspaces = readWorkspaceCacheFile(profile.path);
      allWorkspaces.push(...workspaces);
    }
  }

  return alphabetical(allWorkspaces, (w) => w.name);
};

export default function Command() {
  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [launchingWorkspace, setLaunchingWorkspace] = useState<string | null>(null);

  // Cache the expensive file system operations
  const { data: profiles = [], isLoading: profilesLoading } = useCachedPromise(
    async (): Promise<EdgeProfile[]> => {
      return discoverEdgeProfiles();
    },
    [],
    {
      keepPreviousData: true,
    },
  );

  const { data: workspaceList = [], isLoading: workspacesLoading } = useCachedPromise(
    async (): Promise<Workspace[]> => {
      return readAllWorkspaceCacheFiles();
    },
    [],
    {
      keepPreviousData: true,
    },
  );

  const isLoading = profilesLoading || workspacesLoading;

  const onSelectWorkspace = async (workspace: Workspace) => {
    setLaunchingWorkspace(workspace.id);

    const edgePath = getEdgePath();
    const profileArg =
      workspace.profilePath && workspace.profilePath !== "Default"
        ? `--profile-directory="${workspace.profilePath}"`
        : "";

    const command = `${edgePath} ${profileArg} --launch-workspace="${workspace.id}"`.trim();

    try {
      const { stdout, stderr } = await promisifyExec(command);
      if (stderr) {
        console.error("Error launching workspace:", stderr);
      }
      if (stdout) {
        console.log("Workspace launched successfully:", stdout);
      }
      closeMainWindow();
    } catch (error) {
      console.error("Failed to launch workspace:", error);
    } finally {
      setLaunchingWorkspace(null);
    }
  };

  const getIconColor = (workspaceColor: WorkspaceColor) => {
    return hexMap[workspaceColor] || hexMap[WorkspaceColor.Transparent];
  };

  const filteredWorkspaces =
    selectedProfile === "all" ? workspaceList : workspaceList.filter((w) => w.profilePath === selectedProfile);

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Select Profile" storeValue={true} defaultValue="all" onChange={setSelectedProfile}>
          <List.Dropdown.Item key="all" title="All Profiles" value="all" />
          {profiles.map((profile) => (
            <List.Dropdown.Item
              key={profile.path}
              title={`${profile.name} ${profile.hasWorkspaces ? "" : "(No Workspaces)"}`}
              value={profile.path}
            />
          ))}
        </List.Dropdown>
      }
    >
      {filteredWorkspaces.map((workspace) => (
        <List.Item
          key={`${workspace.profilePath}-${workspace.id}`}
          icon={{
            source: launchingWorkspace === workspace.id ? Icon.ArrowClockwise : Icon.Map,
            tintColor: getIconColor(workspace.color),
          }}
          title={workspace.name}
          subtitle={`${workspace.count} tabs${workspace.profileName ? ` • ${workspace.profileName}` : ""}`}
          accessories={[
            ...(launchingWorkspace === workspace.id
              ? [
                  {
                    tag: {
                      value: "Launching...",
                      color: "#f59e0b",
                    },
                    icon: Icon.ArrowClockwise,
                  },
                ]
              : []),
            ...(workspace.accent
              ? [
                  {
                    tag: {
                      value: "Opening",
                      color: "#10b981",
                    },
                    icon: Icon.ArrowNe,
                  },
                ]
              : []),
            ...(workspace.shared
              ? [
                  {
                    tag: {
                      value: "Shared",
                      color: "#818cf8",
                    },
                    icon: Icon.TwoPeople,
                  },
                ]
              : []),
          ]}
          actions={
            <ActionPanel>
              <Action icon={Icon.Compass} title="Open" onAction={() => onSelectWorkspace(workspace)} />
              <Action.CopyToClipboard content={workspace.connectionUrl} title="Share Link" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
