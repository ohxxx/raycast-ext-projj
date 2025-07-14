import { List, Action, ActionPanel } from "@raycast/api";
import { useState, useEffect } from "react";
import {
  ProjjCacheItem,
  ProjjCache,
  loadProjjCache,
  openWithCursor,
  openInTerminal,
  getProjectName,
  getOwnerName
} from "./utils";
import { CursorIcon, FolderIcon, GitIcon, TerminalIcon, CopyIcon } from "./const";

function ProjectItem({ project }: { project: ProjjCacheItem }) {
  async function handleOpenWithCursor() {
    await openWithCursor(project.name);
  }

  async function handleOpenInTerminal() {
    await openInTerminal(project.name);
  }

  const projectPath = String(project.path || '');
  const projectName = getProjectName(projectPath, project.name);
  const ownerName = getOwnerName(project.url, projectPath);
  const subtitle = ownerName ? `${ownerName}` : projectPath;

  return (
    <List.Item
      title={projectName}
      subtitle={subtitle}
      icon={CursorIcon}
      actions={
        <ActionPanel>
          <ActionPanel.Submenu title="Actions" icon="⚡">
            <Action
              title="Open with Cursor"
              icon={CursorIcon}
              onAction={handleOpenWithCursor}
            />
            <Action.Open
              title="Open in Finder"
              icon={{
                source: FolderIcon,
                tintColor: { light: "black", dark: "white" }
              }}
              target={project.name}
              application="Finder"
            />
            <Action
              title="Open in Terminal"
              icon={{
                source: TerminalIcon,
                tintColor: { light: "black", dark: "white" }
              }}
              onAction={handleOpenInTerminal}
            />
            <Action.CopyToClipboard
              title="Copy Path"
              icon={{
                source: CopyIcon,
                tintColor: { light: "black", dark: "white" }
              }}
              content={project.name}
            />
            {project.url && (
              <Action.CopyToClipboard
                title="Copy Git URL"
                icon={{
                  source: GitIcon,
                  tintColor: { light: "black", dark: "white" }
                }}
                content={project.url}
              />
            )}
          </ActionPanel.Submenu>
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [cache, setCache] = useState<ProjjCache | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCacheData();
  }, []);

  function loadCacheData() {
    try {
      const loadedCache = loadProjjCache();
      if (loadedCache === null) {
        setError("No projj cache found. Please make sure projj is configured and has projects.");
      } else {
        setCache(loadedCache);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <List>
        <List.EmptyView
          title="Loading projects..."
          description="Reading projj cache"
        />
      </List>
    );
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          title="Error loading projects"
          description={error}
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                onAction={loadCacheData}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (!cache || cache.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No projects found"
          description="No projects in projj cache. Use 'projj add' to add projects."
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                onAction={loadCacheData}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List>
      <List.Section title={`Projects (${cache.length})`}>
        {cache.slice().reverse().map((project, index) => (
          <ProjectItem key={`${project.name}-${index}`} project={project} />
        ))}
      </List.Section>
    </List>
  );
}
