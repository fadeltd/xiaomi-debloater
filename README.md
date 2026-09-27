# Xiaomi Debloater — remove MIUI & HyperOS bloatware without root

**Xiaomi Debloater** is a free, open-source desktop app for removing bloatware, ads and telemetry from Xiaomi, Redmi and POCO phones running **MIUI** or **HyperOS 1, 2 and 3**. It works over ADB, needs **no root and no bootloader unlock**, and runs on **Windows, macOS and Linux**.

Unlike general-purpose tools, it only covers Xiaomi. The package list is built for MIUI and HyperOS, rates each package's risk, and gets updates for new Xiaomi OS releases without you reinstalling the app.

<!-- Add a screenshot of the Packages tab with a phone connected, saved as docs/screenshot.png:
![Xiaomi Debloater showing HyperOS packages with risk levels](docs/screenshot.png)
-->

## Features

- **640+ MIUI / HyperOS packages** with plain-English descriptions and a risk rating: 288 safe, 218 caution, 134 danger ("never remove").
- **Always up to date:** the app downloads the latest package list from this repo, so new HyperOS packages are recognised as soon as they are added here.
- **Reversible:** apps are uninstalled for your user only (`pm uninstall -k --user 0`). Removed apps stay listed in the **Removed** tab with a Restore button; nothing is deleted from the system partition.
- **Disable, uninstall, enable, restore** per app, or remove many at once after a confirmation.
- **Filter** by Bloatware, OEM (Xiaomi apps), System, User and Disabled, or search by name.
- **Built-in guide** to debloating MIUI and HyperOS safely, including privacy settings that need no ADB.
- Detects the phone model, MIUI or HyperOS version, and Android version.
- Every action is recorded in an operation log.

## Supported phones

Any Xiaomi, Redmi or POCO phone with MIUI 12–14 or HyperOS 1, 2 or 3, including Global, EEA, India and China ROMs. HyperOS 3 packages come from the Xiaomi 15 Ultra, and other models share most of them. If a package on your phone is missing or wrongly labelled, please [report it](../../issues/new?template=package-report.yml).

## How to debloat your Xiaomi phone

1. **Install ADB.** macOS: `brew install android-platform-tools`. Windows: `winget install Google.PlatformTools`. Linux: `sudo apt install adb`.
2. **Enable Developer options:** Settings > About phone, tap *MIUI version* or *OS version* 7 times.
3. **Enable USB debugging:** Settings > Additional settings > Developer options > *USB debugging*.
4. **Connect the phone by USB** and tap *Allow* on the "Allow USB debugging?" prompt.
5. **Open Xiaomi Debloater.** Your phone and its packages appear within a few seconds.
6. Start with the **Bloatware** tab and packages marked `safe`. Leave `danger` packages alone.

Read the in-app **Guide** tab before removing anything marked `caution`.

## Download

Download the latest build for Windows, macOS or Linux from [Releases](../../releases), or [build it yourself](CONTRIBUTING.md#building-the-app).

## FAQ

**Is it safe?** Packages are removed only for the current user, so they can be restored. Removing a package marked `danger` can still stop the phone from booting properly, and the fix may be a factory reset. Back up first.

**How do I restore a removed app?** Use *Restore* in the app, or run `adb shell cmd package install-existing <package.name>`. A factory reset also restores everything.

**Do I need root or an unlocked bootloader?** No. Everything runs through ADB with USB debugging.

**Will OTA updates still work?** Yes. User-level uninstalls don't block updates, but major updates can bring bloat back and add new packages. Update the list in the app and check again after each system update.

**Why not Universal Android Debloater?** [UAD-ng](https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation) is excellent and covers every brand. Xiaomi Debloater focuses on Xiaomi only, with a list tracked per MIUI/HyperOS version and Xiaomi-specific guidance.

## Contributing

Package list corrections are the most useful contribution. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

The package list and guide were compiled from, and credit goes to:
[UAD-ng](https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation),
[ovsky/hyperos-debloater](https://github.com/ovsky/hyperos-debloater),
[matthieu-pierson/debloat-hyperos-adb](https://github.com/matthieu-pierson/debloat-hyperos-adb),
[kirthandev/MIUI-Debloater-official](https://github.com/kirthandev/MIUI-Debloater-official),
[KernelTruth's MIUI list](https://gist.github.com/KernelTruth/b85b55154c894ad77c6b62c01bfc4b50),
the [XDA Xiaomi 15 Ultra debloat thread](https://xdaforums.com/t/xiaomi-15-ultra-global-debloat-list.4726400/)
and the [r/miui debloat & privacy guide](https://www.reddit.com/r/miui/comments/1sd50rf/the_ultimate_miui_debloat_privacy_guide_no_root/).

## License

[GPL-3.0](LICENSE). Xiaomi, MIUI, HyperOS, Redmi and POCO are trademarks of Xiaomi Inc. This project is not affiliated with or endorsed by Xiaomi.
