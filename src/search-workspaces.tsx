import { ActionPanel, Action, Icon, List, popToRoot } from "@raycast/api";
import { readFileSync } from "fs";
import { Workspace, WorkspaceCache } from "./types/workspace-cache";
import { useEffect, useState } from "react";
import { exec } from "child_process";
import { promisify } from "util";
import { hexMap, WorkspaceColor } from "./types/workspace-color";
import { alphabetical } from "radash";

const promisifyExec = promisify(exec);

const readWorkspaceCacheFile = () => {
  const workspaceCacheFilePath = `${process.env.HOME}/Library/Application Support/Microsoft Edge/Default/Workspaces/WorkspacesCache`;
  const res = readFileSync(workspaceCacheFilePath, "utf-8").toString();

  // The content of the file is in JSON format, so we can parse it directly
  const json = JSON.parse(res) as WorkspaceCache;

  return alphabetical(json.workspaces, (w) => w.name);
};

export default function Command() {
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);

  useEffect(() => {
    const workspaces = readWorkspaceCacheFile();
    setWorkspaceList(workspaces);
  }, []);

  const onSelectWorkspace = async (workspace: Workspace) => {
    const edgePath = "/Applications/Microsoft\\ Edge.app/Contents/MacOS/Microsoft\\ Edge";

    const command = `${edgePath} --launch-workspace="${workspace.id}"`;
    const { stdout, stderr } = await promisifyExec(command);
    if (stderr) {
      console.error("Error launching workspace:", stderr);
    }
    if (stdout) {
      console.log("Workspace launched successfully:", stdout);
    }
    popToRoot();
  };

  const getIconColor = (workspaceColor: WorkspaceColor) => {
    return hexMap[workspaceColor] || hexMap[WorkspaceColor.Transparent];
  };

  return (
    <List>
      {workspaceList.map((workspace) => (
        <List.Item
          key={workspace.id}
          icon={{
            source: Icon.Map,
            tintColor: getIconColor(workspace.color),
          }}
          title={workspace.name}
          subtitle={`${workspace.count} tabs`}
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
