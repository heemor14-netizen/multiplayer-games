type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: number;
}

const FLUSH_INTERVAL = 5000;
const BUFFER_LIMIT = 20;

class Logger {
  private buffer: LogEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isDev = process.env.NODE_ENV === "development";

  private enqueue(level: LogLevel, message: string, data?: unknown) {
    this.buffer.push({ level, message, data, timestamp: Date.now() });

    if (this.buffer.length >= BUFFER_LIMIT) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL);
    }
  }

  private flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);

    if (this.isDev) {
      entries.forEach((e) => {
        const tag = `[${e.level.toUpperCase()}]`;
        const ts = new Date(e.timestamp).toISOString();
        if (e.data !== undefined) {
          console.log(`${ts} ${tag} ${e.message}`, e.data);
        } else {
          console.log(`${ts} ${tag} ${e.message}`);
        }
      });
    }

    if (typeof window !== "undefined" && !this.isDev) {
      try {
        const payload = JSON.stringify(entries);
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/logs", payload);
        }
      } catch {
        // silent fail - logger never blocks
      }
    }
  }

  debug(message: string, data?: unknown) {
    if (this.isDev) this.enqueue("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.enqueue("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.enqueue("warn", message, data);
  }

  error(message: string, data?: unknown) {
    this.enqueue("error", message, data);
  }
}

export const logger = new Logger();
