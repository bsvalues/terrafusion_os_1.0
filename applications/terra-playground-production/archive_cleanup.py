import os
import shutil
import datetime

class CodeArchiver:
    def __init__(self, workspace_root, archive_root="archive"):
        self.workspace_root = os.path.abspath(workspace_root)
        self.archive_root = os.path.join(self.workspace_root, archive_root)
        os.makedirs(self.archive_root, exist_ok=True)

    def _create_timestamped_archive_subdir(self):
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        return os.path.join(self.archive_root, timestamp)

    def archive_items(self, items_to_archive, reason="General cleanup"):
        if not items_to_archive:
            print("No items specified for archiving.")
            return

        archive_subdir = self._create_timestamped_archive_subdir()
        os.makedirs(archive_subdir, exist_ok=True)
        log_file_path = os.path.join(archive_subdir, "archive_log.txt")

        with open(log_file_path, "w") as log_file:
            log_file.write(f"Archiving Session: {datetime.datetime.now()}\n")
            log_file.write(f"Reason: {reason}\n\n")
            log_file.write("Archived Items:\n")

            for item_path in items_to_archive:
                abs_item_path = os.path.abspath(os.path.join(self.workspace_root, item_path))
                if not os.path.exists(abs_item_path):
                    print(f"Warning: Item not found at '{abs_item_path}'. Skipping.")
                    log_file.write(f"- Skipped (not found): {item_path}\n")
                    continue

                relative_path_in_archive = os.path.relpath(abs_item_path, self.workspace_root)
                destination_path = os.path.join(archive_subdir, relative_path_in_archive)

                # Ensure parent directories exist in the archive destination
                os.makedirs(os.path.dirname(destination_path), exist_ok=True)

                try:
                    if os.path.isdir(abs_item_path):
                        shutil.move(abs_item_path, destination_path)
                        print(f"Moved directory '{item_path}' to '{destination_path}'")
                    else:
                        shutil.move(abs_item_path, destination_path)
                        print(f"Moved file '{item_path}' to '{destination_path}'")
                    log_file.write(f"- Moved: {item_path} -> {os.path.join(os.path.basename(archive_subdir), relative_path_in_archive)}\n")
                except Exception as e:
                    print(f"Error archiving '{item_path}': {e}")
                    log_file.write(f"- Error archiving '{item_path}': {e}\n")
            log_file.write("\nArchiving session completed.\n")
        print(f"\nArchiving session completed. Log saved to: {log_file_path}")

if __name__ == "__main__":
    archiver = CodeArchiver(os.getcwd()) # Assumes script is run from workspace root
    items_to_archive = [
        "server/extensions/samples/"
    ]
    # IMPORTANT: Review 'items_to_archive' carefully before running!
    # user_confirmation = input(f"Are you sure you want to archive these {len(items_to_archive)} items? (yes/no): ").lower()
    # if user_confirmation == 'yes':
    archiver.archive_items(items_to_archive, reason="Archiving sample extensions as part of codebase cleanup.")
    # else:
    # print("Archiving cancelled.") 