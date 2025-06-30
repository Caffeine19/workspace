import { ActionPanel, Action, Form, showToast, Toast, closeMainWindow } from "@raycast/api";
import { useState, useEffect } from "react";
import { openNewEdgeWindow } from "./new-window";
import { discoverEdgeProfiles } from "./utils/edgePaths";
import { EdgeProfile } from "./types/edge-profile";

export default function NewWindowCommand() {
  const [profiles, setProfiles] = useState<EdgeProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("Default");
  const [url, setUrl] = useState<string>("");
  const [incognito, setIncognito] = useState<boolean>(false);

  useEffect(() => {
    const discoveredProfiles = discoverEdgeProfiles();
    setProfiles(discoveredProfiles);

    // Set first available profile as default
    if (discoveredProfiles.length > 0) {
      setSelectedProfile(discoveredProfiles[0].path);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Opening new Edge window...",
      });

      await openNewEdgeWindow({
        url: url || undefined,
        incognito,
        profilePath: selectedProfile,
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Edge window opened successfully",
      });

      closeMainWindow();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open Edge window",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Open New Window" />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="profile" title="Profile" value={selectedProfile} onChange={setSelectedProfile}>
        {profiles.map((profile) => (
          <Form.Dropdown.Item key={profile.path} value={profile.path} title={profile.name} />
        ))}
      </Form.Dropdown>

      <Form.TextField id="url" title="URL (Optional)" placeholder="https://example.com" value={url} onChange={setUrl} />

      <Form.Checkbox
        id="incognito"
        title="Incognito Mode"
        label="Open in incognito mode"
        value={incognito}
        onChange={setIncognito}
      />
    </Form>
  );
}
