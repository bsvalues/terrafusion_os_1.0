# 🚀 TerraFusionPlatform: ICSF AI-Driven DevOps Framework

Welcome to the **TerraFusionPlatform ICSF DevOps AI System** — a fully structured, autonomous environment for running high-quality, AI-assisted development workflows.

This project is designed to:

- Fix broken user flows, frontend inconsistencies, and data state awareness issues.
- Deliver modular, production-ready code.
- Maintain full transparency, testing, and auditability through every phase.

---

## 📋 Project Structure

| Folder/File                 | Purpose                                                                      |
| :-------------------------- | :--------------------------------------------------------------------------- |
| `exports/`                  | Where AI-generated `.md` reports (Tickets, Tests, Phase Reports) are stored. |
| `auto_folder_md_reports.py` | Organizes exports into phase-specific folders automatically.                 |
| `batch_pr_generator.py`     | Creates a full GitHub Pull Request description from export reports.          |
| `PR_description.md`         | Auto-generated Pull Request body ready for GitHub.                           |
| `README.md`                 | You are here. 📚                                                             |

---

## 🛠 How to Use This System

1. **Run your AI Agent**

   - Ensure it follows the Master Control Prompt.
   - Export phase outputs as `.md` files into the `./exports/` folder.

2. **Organize Reports**
   ```bash
   python3 auto_folder_md_reports.py
   ```
