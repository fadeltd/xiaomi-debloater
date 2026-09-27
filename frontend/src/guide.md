# Xiaomi / HyperOS Debloat Guide

## Before you start

- **Turn on Developer options.** Go to Settings > About phone and tap *MIUI version* (on HyperOS it's called *OS version*) about 7 times, until the phone says you are a developer. [2][5][8]
- **Turn on USB debugging.** Go to Settings > Additional settings > Developer options and switch on *USB debugging*. Also switch on *USB debugging (Security settings)*, which needs you to be signed in to a Mi Account. When you first connect the phone, tap Allow on the RSA prompt. [2][5]
- **Back up first.** The Reddit guide suggests a local backup at Settings > About phone > Back up and restore > Mobile device, then copying the `MIUI/backup/AllBackup` folder to your PC along with DCIM, Downloads and Documents. [1] A bad removal can bootloop the phone, and the only fix may be a factory reset that wipes your data. [2]
- **Uninstall vs disable:**
  - `pm uninstall -k --user 0 <pkg>` removes the app for your user only. The APK stays on the system partition and `-k` keeps its data, so you can undo it. [8]
  - `pm disable-user --user 0 <pkg>` freezes the app and leaves it installed. [8] On newer HyperOS (Android 14+), Xiaomi blocks freezing system apps with a `SecurityException`, so ovsky's tool uses uninstall-for-user-0 instead. [5]
- **Undo:** `adb shell cmd package install-existing <pkg>` brings a removed package back. [3] `pm install-existing --user 0 <pkg>` does the same thing. [8]
- **Reboot after each batch.** If the phone restarts normally, you probably haven't broken anything core. [3]
- **Research anything you're unsure about.** Remove packages one at a time and check what each one does first. [6]

## Recommended order

1. **Ads and telemetry first.** Examples: `com.miui.msa.global`, `com.miui.analytics`, `com.miui.systemAdSolution`, `com.miui.daemon`, `com.xiaomi.security.onetrack`, and the Facebook stubs (`com.facebook.appmanager/services/system`). ovsky's "Phase 1" and every list agree on these. [5][6][8]
2. **Third-party preloads next.** Games, shopping apps, Netflix/Spotify stubs and carrier apps (Orange, Vodafone, Telekom, O2). These are all rated Recommended in UAD-ng. [4][7]
3. **Optional Xiaomi apps last, and only if you've installed replacements.** Examples: Gallery, Weather, Notes, Music, Calendar, File Manager, Browser. ovsky calls this phase "Caution". [5]
4. Treat ovsky's "Risky" group (Security Center, Find Device, GetApps, Mi Account, Themes, Mi Cloud) and UAD-ng's Expert/Unsafe entries as keep-unless-you're-sure. ovsky skips the risky phase by default. [4][5]

mpierson offers the same idea as three profiles (safe, balanced, aggressive), and the aggressive one is the most likely to break features. [8]

## Privacy settings that don't need ADB

All of the following come from the Reddit guide: [1]
- **Private DNS:** Settings > Connection & sharing > Private DNS > `dns.adguard-dns.com` blocks ads across the whole system.
- **Revoke system permissions:** Settings > Passwords & security > Authorization & revocation. Turn off *msa*, *MIUI Daemon*, *Feedback* and *System apps updater*; the last one stops silent installs such as Game Center. Also turn off *Calendar* to stop promo events. You may need to tap Revoke more than once.
- **Ads:** Settings > Passwords & security > Privacy > Ad services. Turn off *Personalized ad recommendations* and the *User Experience Program*.
- **GetApps:** setting the phone region to United States hides GetApps.
- **Scanning:** Settings > Location > Location services. Turn off Wi-Fi and Bluetooth scanning.
- **Lock screen feed:** Turn off *Glance for Mi* (Wallpaper Carousel) under Always-on display & Lock screen.
- **Offline apps:** Security app > Data usage > Restrict data usage. Block network access for apps that don't need it.

Some Xiaomi apps (Security, Downloads, Files, Themes, Music, GetApps) may have their own "recommendations" switch. None of the sources document these switches, so check each app's settings yourself.

## Never remove

| Package | Why |
|---|---|
| `com.miui.securitycenter`, `com.miui.securitycore`, `com.miui.securityadd` | Security stack. UAD-ng reports bootloops, especially before MIUI 13. [4] |
| `com.android.updater` | System updates. Can bootloop older MIUI. [4] |
| `com.miui.home` (or your POCO launcher) | Without it you lose gestures and recents, even with another launcher. [4] |
| `com.lbe.security.miui`, `com.miui.permission` | Permission manager. ovsky keeps these restore-only. [4][5] |
| `com.miui.rom`, `com.miui.system`, `com.miui.core`, `android.miui.overlay` | Core MIUI framework. [4] |
| `com.miui.global.packageinstaller`, `com.miui.packageinstaller`, `com.android.packageinstaller` | Needed to install apps. Removal bootloops Xiaomi.eu and China ROMs. [4] |
| `com.xiaomi.finddevice`, `com.xiaomi.account` | Sign out of your Mi Account first, or you can get locked out. Removing Find Device also breaks factory reset from Settings. [4] |
| `com.xiaomi.micloud.sdk` | Makes the phone reboot on its own. [4] |
| `com.android.overlay.circletosearch` | Soft brick on HyperOS 2. [4] |
| `com.android.htmlviewer`, `com.google.android.ext.shared` | Bootloops reported on MIUI 12.5–14. [4] |
| `com.miui.systemui.carriers.overlay`, `com.android.phone`, `com.android.providers.telephony` | Calls, SIM and LTE. [4] |
| `com.miui.miwallpaper` | Leaves a black lock screen and breaks "Set as wallpaper". [8] |
| `com.android.vpndialogs` | Keep it if you use any VPN app. [3] |

## HyperOS notes

- Some packages have different names on HyperOS. ovsky lists `com.miui.findmy` (HyperOS) alongside `com.xiaomi.finddevice`, `com.xiaomi.scanner` alongside `com.miui.scanner`, `com.xiaomi.market`/`com.xiaomi.mipicks` for GetApps, and three names for Themes. [5]
- These packages only appear on HyperOS: `com.xiaomi.hypercomm` (interconnect) and `com.xiaomi.aicr` (AI engine). [5] On HyperOS 3, the Camera Ring feature depends on `com.android.inputsettings.overlay.miui`. [4] Removing `miui.systemui.plugin` replaces the HyperOS control center and volume UI with the stock Android versions. [4]
- China and Global/EEA ROMs ship different packages. On EU ROMs the default dialer is Google's. On a HyperOS 2 EU 15 Ultra, removing `com.miui.audiomonitor`, `com.android.calllogbackup`, the MIUI SystemUI/Settings overlays or the permission-controller overlay broke the call-record button. [3]
- **Joyose** (`com.xiaomi.joyose`): the sources disagree. Some XDA users say it throttles games, while others keep it for thermal control. ovsky asks you before removing it. [3][5]
- **Bootloader unlock:** an XDA contributor advises global-device owners who plan to unlock the bootloader not to use the aggressive 15 Ultra list. [3]

## After OTA updates

- An uninstall for user 0 doesn't stop OTA updates. [9] mpierson says OTA can break if you remove `com.xiaomi.xmsf`, `xmsfkeeper`, `com.miui.cloudservice(.sysbase)`, `com.xiaomi.micloud.sdk`, `com.miui.daemon` or `com.xiaomi.simactivate.service`. Reinstall them and reboot if updates stop. [8]
- Major updates add new bloat. The XDA list was revised for HyperOS 3 for this reason. [3] Some packages come back too: `com.xiaomi.ugd` reappeared on HyperOS. [4]
- After every system update, open this app, press **Update list**, and check the Bloatware tab for anything new.

## Sources

1. Reddit r/miui, "The Ultimate MIUI Debloat & Privacy Guide (No Root)": https://www.reddit.com/r/miui/comments/1sd50rf/the_ultimate_miui_debloat_privacy_guide_no_root/ (read via web.archive.org)
2. kirthandev/MIUI-Debloater-official: https://github.com/kirthandev/MIUI-Debloater-official
3. XDA, "Xiaomi 15 Ultra Global – Debloat List" (pages 1–6): https://xdaforums.com/t/xiaomi-15-ultra-global-debloat-list.4726400/ (read via web.archive.org)
4. UAD-ng uad_lists.json: https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation
5. ovsky/hyperos-debloater: https://github.com/ovsky/hyperos-debloater
6. KernelTruth gist, "XIAOMI MIUI: Ultimate Package Uninstall List 2024": https://gist.github.com/KernelTruth/b85b55154c894ad77c6b62c01bfc4b50
7. Xiaomi_15_Ultra_HyperOS_3_Debloat.txt, the package list attached to the XDA thread [3]
8. matthieu-pierson/debloat-hyperos-adb: https://github.com/matthieu-pierson/debloat-hyperos-adb
9. leechuanfeng/hyperos-debloat: https://github.com/leechuanfeng/hyperos-debloat
