cask "xiaomi-debloater" do
  version "@VERSION@"
  sha256 "@SHA256_MACOS@"

  url "https://github.com/fadeltd/xiaomi-debloater/releases/download/v#{version}/xiaomi-debloater-v#{version}-macos-universal.zip"
  name "Xiaomi Debloater"
  desc "Remove MIUI and HyperOS bloatware over ADB, without root"
  homepage "https://fadeltd.github.io/xiaomi-debloater/"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on cask: "android-platform-tools"
  depends_on :macos

  app "xiaomi-debloater.app", target: "Xiaomi Debloater.app"

  zap trash: [
    "~/Library/Application Support/xiaomi-debloater",
    "~/Library/Caches/io.github.fadeltd.xiaomi-debloater",
    "~/Library/Preferences/io.github.fadeltd.xiaomi-debloater.plist",
    "~/Library/WebKit/io.github.fadeltd.xiaomi-debloater",
  ]

  caveats <<~EOS
    Xiaomi Debloater is not notarized by Apple yet, so macOS blocks the first launch.
    To allow it, either run:
      xattr -dr com.apple.quarantine "#{appdir}/Xiaomi Debloater.app"
    or open it once, then go to System Settings > Privacy & Security and click "Open Anyway".
  EOS
end
