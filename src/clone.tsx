import { List, Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { useState, useEffect } from "react";
import {
  checkProjjInstallation,
  checkProjjConfig,
  loadProjjConfig,
  openWithCursor,
  execAsync,
  getDefaultShell,
  openInTerminal
} from "./utils";
import { FolderIcon, TerminalIcon } from "./const";

function EnvironmentCheck({ onEnvironmentReady }: { onEnvironmentReady: () => void }) {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEnvironment();
  }, []);

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }

  async function checkEnvironment() {
    try {
      const projjCheck = await checkProjjInstallation();

      if (!projjCheck.installed) {
        setError("projj is not installed or not found in PATH");
        setIsChecking(false);
        return;
      }

      if (!checkProjjConfig()) {
        setError("projj is not configured. Please run 'projj init' first.");
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
      onEnvironmentReady();
    } catch (error) {
      setError(getErrorMessage(error));
      setIsChecking(false);
    }
  }

  async function installProjj() {
    await showToast(Toast.Style.Animated, "Installing projj...");
    try {
      const shell = getDefaultShell();
      await execAsync(`${shell} -i -c "npm install -g projj"`);
      await showToast(Toast.Style.Success, "projj installed successfully!");
      checkEnvironment();
    } catch (error) {
      await showToast(Toast.Style.Failure, "Failed to install projj", getErrorMessage(error));
    }
  }

  async function initProjj() {
    await showToast(Toast.Style.Animated, "Initializing projj...");
    try {
      const shell = getDefaultShell();
      await execAsync(`${shell} -i -c "projj init"`);
      await showToast(Toast.Style.Success, "projj initialized successfully!");
      checkEnvironment();
    } catch (error) {
      await showToast(Toast.Style.Failure, "Failed to initialize projj", getErrorMessage(error));
    }
  }

  if (isChecking) {
    return (
      <List>
        <List.EmptyView
          title="Checking environment..."
          description="Verifying projj installation and configuration"
        />
      </List>
    );
  }

  if (error) {
    const isNotInstalled = error.includes("not installed") || error.includes("not found");
    const isNotConfigured = error.includes("not configured");

    return (
      <List>
        <List.EmptyView
          title="Environment Setup Required"
          description={error}
          actions={
            <ActionPanel>
              {isNotInstalled && (
                <Action
                  title="Install projj"
                  onAction={installProjj}
                />
              )}
              {isNotConfigured && (
                <Action
                  title="Initialize projj"
                  onAction={initProjj}
                />
              )}
              <Action
                title="Retry Check"
                onAction={checkEnvironment}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return null;
}

function GitUrlForm() {
  const { push } = useNavigation();
  const [environmentReady, setEnvironmentReady] = useState(false);

  async function handleSubmit(values: { gitUrl: string }) {
    if (!values.gitUrl.trim()) {
      await showToast(Toast.Style.Failure, "Please enter a git URL");
      return;
    }

    push(<BaseDirectoryList gitUrl={values.gitUrl} />);
  }

  if (!environmentReady) {
    return <EnvironmentCheck onEnvironmentReady={() => setEnvironmentReady(true)} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Choose Base Directory"
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="gitUrl"
        title="Git URL"
        placeholder="https://github.com/user/repo.git"
        info="Enter the git repository URL to clone"
      />
    </Form>
  );
}

function PostCloneActions({ projectPath, projectName }: { projectPath: string; projectName: string }) {
  const { pop } = useNavigation();

  async function handleOpenWithCursor() {
    await openWithCursor(projectPath);
    pop();
  }

  async function handleOpenInTerminal() {
    await openInTerminal(projectPath);
    pop();
  }

  return (
    <List>
      <List.Section title={`${projectName} cloned successfully!`}>
        <List.Item
          title="Open with Cursor"
          subtitle="Open project in Cursor editor"
          icon="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 32 32'%3E%3C!-- Icon from VSCode Icons by Roberto Huertas - https://github.com/vscode-icons/vscode-icons/blob/master/LICENSE --%3E%3Cpath fill='%23444' d='M3.75 9v14h24.5V9L16 2'/%3E%3Cpath fill='%23939393' d='M16 16V2L3.75 9l24.5 14L16 30L3.75 23'/%3E%3Cpath fill='%23e3e3e3' d='M28.25 9H16v21'/%3E%3Cpath fill='%23fff' d='M3.75 9h24.5L16 16'/%3E%3C/svg%3E"
          actions={
            <ActionPanel>
              <Action
                title="Open with Cursor"
                onAction={handleOpenWithCursor}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Open in Finder"
          subtitle="Open project folder in Finder"
          icon={{
            source: FolderIcon,
            tintColor: { light: "black", dark: "white" }
          }}
          actions={
            <ActionPanel>
              <Action.Open
                title="Open in Finder"
                target={projectPath}
                application="Finder"
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Open in Terminal"
          subtitle="Open project folder in Terminal"
          icon={{
            source: TerminalIcon,
            tintColor: { light: "black", dark: "white" }
          }}
          actions={
            <ActionPanel>
              <Action
                title="Open in Terminal"
                onAction={handleOpenInTerminal}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

function BaseDirectoryList({ gitUrl }: { gitUrl: string }) {
  const { pop, push } = useNavigation();
  const config = loadProjjConfig();

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }

  function cleanupScript(scriptPath: string) {
    try {
      unlinkSync(scriptPath);
    } catch (error) {
      console.error("Error cleaning up script:", error);
    }
  }

  function isCloneSuccess(stdout: string): boolean {
    return Boolean(stdout && (stdout.includes("✔︎") || stdout.includes("Done") || stdout.includes("Start adding repository")));
  }

  async function handleCloneSuccess(stdout: string) {
    const pathMatch = stdout.match(/Cloning into (.+?)$/m);
    if (pathMatch) {
      const projectPath = pathMatch[1].trim();
      const projectName = projectPath.split('/').pop() || 'Unknown Project';
      await showToast(Toast.Style.Success, "Repository cloned successfully!");
      push(<PostCloneActions projectPath={projectPath} projectName={projectName} />);
    } else {
      await showToast(Toast.Style.Success, "Repository cloned successfully!");
      pop();
    }
  }

  async function handleClone(baseDir: string) {
    const homeDir = process.env.HOME || homedir();
    const shell = getDefaultShell();
    const scriptPath = join(homeDir, '.raycast_projj_clone.sh');

    try {
      await showToast(Toast.Style.Animated, "Cloning repository...");

      const projjCheck = await checkProjjInstallation();
      if (!projjCheck.installed || !projjCheck.path) {
        throw new Error("projj not found. Please install projj first.");
      }

      const baseIndex = config!.base.findIndex(dir => dir === baseDir);
      if (baseIndex === -1) {
        throw new Error("Base directory not found in config");
      }

      const projjCommand = projjCheck.path.includes('npx') ? projjCheck.path : `"${projjCheck.path}"`;
      const scriptContent = `#!${shell}
echo "${baseIndex + 1}" | ${projjCommand} add "${gitUrl}"
`;

      writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

      let stdout = '';
      let stderr = '';

      try {
        const result = await execAsync(`${shell} -i "${scriptPath}"`, { cwd: homeDir });
        stdout = result.stdout || '';
        stderr = result.stderr || '';
      } catch (error: any) {
        stdout = error.stdout || '';
        stderr = error.stderr || error.message || '';
      }

      cleanupScript(scriptPath);

      if (isCloneSuccess(stdout)) {
        await handleCloneSuccess(stdout);
        return;
      }

      if (stderr && stderr.trim() && !stderr.includes("Cloning into")) {
        await showToast(Toast.Style.Failure, "Clone failed", stderr);
      } else {
        await showToast(Toast.Style.Success, "Repository cloned successfully!");
        pop();
      }
    } catch (error) {
      cleanupScript(scriptPath);
      await showToast(Toast.Style.Failure, "Clone failed", getErrorMessage(error));
    }
  }

  if (!config) {
    return (
      <List>
        <List.EmptyView
          title="No projj config found"
          description="Please make sure projj is configured with base directories"
        />
      </List>
    );
  }

  return (
    <List>
      <List.Section title={`Choose base directory for: ${gitUrl}`}>
        {config.base.map((baseDir, index) => (
          <List.Item
            key={index}
            title={baseDir}
            actions={
              <ActionPanel>
                <Action
                  title="Clone Here"
                  onAction={() => handleClone(baseDir)}
                />
                <Action.Open
                  title="Open in Finder"
                  target={baseDir}
                  application="Finder"
                />
                <Action.CopyToClipboard
                  title="Copy Path"
                  content={baseDir}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

export default function Command() {
  return <GitUrlForm />;
}