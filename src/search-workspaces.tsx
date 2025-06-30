import { ActionPanel, Action, Icon, List, closeMainWindow } from "@raycast/api";
import { readFileSync, existsSync } from "fs";
import { Workspace, WorkspaceCache } from "./types/workspace-cache";
import { useEffect, useState } from "react";
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
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [profiles, setProfiles] = useState<EdgeProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("all");

  useEffect(() => {
    const discoveredProfiles = discoverEdgeProfiles();
    setProfiles(discoveredProfiles);

    const workspaces = readAllWorkspaceCacheFiles();
    setWorkspaceList(workspaces);
  }, []);

  const onSelectWorkspace = async (workspace: Workspace) => {
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
    }
  };

  const getIconColor = (workspaceColor: WorkspaceColor) => {
    return hexMap[workspaceColor] || hexMap[WorkspaceColor.Transparent];
  };

  const filteredWorkspaces =
    selectedProfile === "all" ? workspaceList : workspaceList.filter((w) => w.profilePath === selectedProfile);

  return (
    <List
      searchBarAccessory={
        <List.Dropdown tooltip="Select Profile" value={selectedProfile} onChange={setSelectedProfile}>
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
            source: Icon.Map,
            tintColor: getIconColor(workspace.color),
          }}
          title={workspace.name}
          subtitle={`${workspace.count} tabs${workspace.profileName ? ` • ${workspace.profileName}` : ""}`}
          accessories={[
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
              <Action icon={Icon.Compass} title="Open" onAction={() => onSelectWorkspace(workspace)}></Action>
              <Action.CopyToClipboard content={workspace.connectionUrl} title="Share Link" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
