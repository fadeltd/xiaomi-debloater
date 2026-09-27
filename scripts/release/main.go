// Command release cuts a release from CHANGELOG.md.
//
// It reads the Unreleased section, decides the semver bump from its headings,
// rewrites CHANGELOG.md, wails.json and the AppStream metainfo, and reports the
// outcome for the workflow to consume. It writes files but never touches git:
// the workflow owns committing, tagging and pushing, so this stays runnable
// locally as a dry run.
//
//	go run ./scripts/release -dry-run     # preview the next release
//	go run ./scripts/release              # apply it
//	go run ./scripts/release -notes 1.1.0 # print the notes of a released version
package main

import (
	"flag"
	"fmt"
	"os"
	"time"
)

const (
	changelogPath = "CHANGELOG.md"
	wailsPath     = "wails.json"
	metainfoPath  = "packaging/linux/io.github.fadeltd.XiaomiDebloater.metainfo.xml"
)

func main() {
	dryRun := flag.Bool("dry-run", false, "print what would be released without writing files")
	notes := flag.String("notes", "", "print the changelog notes of this version and exit")
	flag.Parse()

	if err := run(*dryRun, *notes); err != nil {
		fmt.Fprintln(os.Stderr, "release:", err)
		os.Exit(1)
	}
}

func run(dryRun bool, notesVersion string) error {
	changelog, err := os.ReadFile(changelogPath)
	if err != nil {
		return err
	}

	if notesVersion != "" {
		n := NotesFor(string(changelog), notesVersion)
		if n == "" {
			return fmt.Errorf("no [%s] section in %s", notesVersion, changelogPath)
		}
		fmt.Println(n)
		return nil
	}

	wails, err := os.ReadFile(wailsPath)
	if err != nil {
		return err
	}
	current, err := WailsVersion(string(wails))
	if err != nil {
		return err
	}
	today := time.Now().UTC().Format("2006-01-02")

	rel, err := ApplyRelease(string(changelog), current, today)
	if err != nil {
		return err
	}
	if rel == nil {
		fmt.Println("Nothing under [Unreleased]: no release.")
		return emit("released", "false")
	}

	fmt.Printf("bump    : %s\nversion : %s -> %s\ntag     : v%s\n", rel.Bump, current, rel.Version, rel.Version)
	if dryRun {
		fmt.Printf("\n--- notes ---\n%s\n\n(dry run: no files written)\n", rel.Notes)
		return nil
	}

	newWails, err := SetWailsVersion(string(wails), rel.Version)
	if err != nil {
		return err
	}
	metainfo, err := os.ReadFile(metainfoPath)
	if err != nil {
		return err
	}
	newMetainfo, err := AddMetainfoRelease(string(metainfo), rel.Version, today)
	if err != nil {
		return err
	}

	for path, content := range map[string]string{
		changelogPath: rel.Changelog,
		wailsPath:     newWails,
		metainfoPath:  newMetainfo,
	} {
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			return err
		}
	}

	for k, v := range map[string]string{"released": "true", "version": rel.Version, "tag": "v" + rel.Version} {
		if err := emit(k, v); err != nil {
			return err
		}
	}
	// Release notes are multi-line, so they need the delimiter form.
	if err := appendOutput("notes<<RELEASE_NOTES_EOF\n" + rel.Notes + "\nRELEASE_NOTES_EOF"); err != nil {
		return err
	}

	fmt.Printf("\n%s, %s and the metainfo updated.\n", changelogPath, wailsPath)
	return nil
}

// emit sets a single-line step output when running under GitHub Actions.
func emit(key, value string) error {
	return appendOutput(key + "=" + value)
}

func appendOutput(line string) error {
	out := os.Getenv("GITHUB_OUTPUT")
	if out == "" {
		return nil
	}
	f, err := os.OpenFile(out, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = fmt.Fprintln(f, line)
	return err
}
