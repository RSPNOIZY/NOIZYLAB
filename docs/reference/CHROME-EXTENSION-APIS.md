# Chrome Extension APIs (kept on file)

**Owner:** Robert Stephen Plowman (RSP_001)
**Status:** Reference only. No NOIZY extension is planned yet.
**Source:** a summary RSP_001 pasted on 2026-10-15. **Not yet checked** against Google's docs (developer.chrome.com/docs/extensions/reference). Check before building anything.

---

## Basics

- Chrome extension APIs come as **namespaces**, each with methods and properties.
- **From Chrome 148:** the APIs are also available under `browser`, the cross-browser alternative to `chrome`.
- **Methods are asynchronous** and return promises by default.
- **Manifest V3** works in general from Chrome 88.

## API groups

- **Core browser:** `tabs`, `windows`, `action`, `storage`, `runtime`, `scripting`, `sidePanel`.
- **Data and privacy:** `cookies`, `history`, `bookmarks`, `browsingData`, `declarativeNetRequest`, `privacy`.
- **System and device:** `alarms`, `power`, `idle`, `downloads`, `notifications`, `system.cpu`, `system.display`, `system.memory`, `system.storage`.
- **Developer tools:** `debugger`, `devtools.inspectedWindow`, `devtools.network`, `devtools.panels`, `devtools.performance`, `devtools.recorder`.
- **ChromeOS only:** `audio`, `certificateProvider`, `documentScan`, `enterprise.*`, `fileBrowserHandler`, `fileSystemProvider`, `input.ime`, `loginState`, `printing`, `vpnProvider`, `wallpaper`.

## If NOIZY ever builds an extension

- **Start in `redteam/`**, like every agent. An extension that can read pages is an agent with tools.
- **Ask for the fewest permissions.** `cookies`, `history`, `debugger` and `<all_urls>` are high-risk. Avoid them unless there's no other way.
- **Never read** Proton, bank or consent pages.
- **Check HALT** before any automated action.
