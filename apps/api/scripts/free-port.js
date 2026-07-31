/**
 * Frees PORT (default 5001) before API start so orphaned node processes
 * from a previous `npm run dev` don't cause EADDRINUSE + login hangs.
 */
import { execSync } from "child_process";

const PORT = String(process.env.PORT || 5001);

function freePortWindows(port) {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
  }

  for (const pid of pids) {
    // Don't kill ourselves
    if (String(process.pid) === pid) continue;
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[free-port] Stopped PID ${pid} (was using :${port})`);
    } catch {
      /* already gone */
    }
  }
}

function freePortUnix(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
    });
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      if (String(process.pid) === pid) continue;
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`[free-port] Stopped PID ${pid} (was using :${port})`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

if (process.platform === "win32") freePortWindows(PORT);
else freePortUnix(PORT);
